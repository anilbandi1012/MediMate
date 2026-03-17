import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import PageHeader from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Search,
  Filter,
  Loader2,
  AlertTriangle,
  MoreVertical,
  Edit,
  Trash2,
} from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import medicinesApi, { type ApiMedicine, type MissingMedicineItem } from "@/lib/medicines-api";
import { toMedicine, type Medicine } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { getErrorMessage } from "@/lib/api";
import { MedicineFormDialog } from "@/components/medicine/MedicineFormDialog";
import { DeleteMedicineDialog } from "@/components/medicine/DeleteMedicineDialog";
import { MissingMedicineCard } from "@/components/medicine/MissingMedicineCard";
import OCRUpload from "@/components/OCRUpload";
import { parseMedicinesFromOCR } from "@/lib/ocrParser";

/* ---------- OCR TYPES ---------- */
type OCRResult = {
  text?: string;
  extracted_text?: string;
  result?: string;
};

export default function MedicinesPage() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [pendingMissingMedicine, setPendingMissingMedicine] =
    useState<MissingMedicineItem | null>(null);

  const { toast } = useToast();

  /* ---------- OCR STATE ---------- */
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [detectedMeds, setDetectedMeds] = useState<any[]>([]);

  /* ---------- LOAD OCR (NO REFRESH BUG) ---------- */
  useEffect(() => {
    const stored = localStorage.getItem("ocrResult");
    if (stored) {
      const parsed = JSON.parse(stored);
      setOcrResult(parsed);
    }
  }, []);

  /* ---------- PARSE OCR ---------- */
  useEffect(() => {
    if (!ocrResult) return;

    const rawText =
      ocrResult.extracted_text ||
      ocrResult.text ||
      ocrResult.result ||
      "";

    if (!rawText) return;

    const parsed = parseMedicinesFromOCR(rawText);
    setDetectedMeds(parsed);
  }, [ocrResult]);

  /* ---------- FETCH MEDICINES ---------- */
  const fetchMedicines = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await medicinesApi.list({
        search: searchQuery || undefined,
      });
      const medicinesData = response.data.items.map((apiMed: ApiMedicine) =>
        toMedicine(apiMed)
      );
      setMedicines(medicinesData);
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      toast({
        title: "Error fetching medicines",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, toast]);

  useEffect(() => {
    fetchMedicines();
  }, [fetchMedicines]);

  /* ---------- MISSING MEDICINES ---------- */
  const { data: missingMedicines, refetch: refetchMissing } = useQuery({
    queryKey: ["missing-from-inventory"],
    queryFn: async () => {
      const response = await medicinesApi.getMissingFromInventory();
      return response.data;
    },
  });

  /* ---------- SAVE OCR TO BACKEND ---------- */
  const saveDetectedMedicines = async () => {
    try {
      for (const med of detectedMeds) {
        await medicinesApi.create(med);
      }

      toast({
        title: "Medicines added",
        description: `${detectedMeds.length} medicines saved`,
      });

      localStorage.removeItem("ocrResult");
      setDetectedMeds([]);
      setOcrResult(null);
      fetchMedicines();
      refetchMissing();
    } catch {
      toast({
        title: "Failed to save medicines",
        variant: "destructive",
      });
    }
  };
  // console.log("OCRRaw:", ocrResult.extracted_text);

  /* ---------- UI ---------- */
  return (
    <div className="space-y-6">
      <PageHeader title="Medicines" description="Manage your medication inventory">
        <Button className="gradient-primary" onClick={() => setFormDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Medicine
        </Button>
        <OCRUpload onResult={(data) => setOcrResult(data)} />
      </PageHeader>

      {/* OCR RESULT BLOCK */}
      {detectedMeds.length > 0 && (
        <div className="p-4 rounded-[0.7rem] mb-4 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900">
          <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-gray-100">
            Detected from Prescription
          </h3>

          {detectedMeds.map((m, i) => (
            <div
              key={i}
              className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-2 mb-2 rounded"
            >
              <b>{m.name}</b> — {m.dosage} — {m.frequency}
            </div>
          ))}

          <Button
            className="gradient-primary"
            onClick={() => {
              detectedMeds.forEach(m => {
                medicinesApi.create({
                  name: m.name,
                  dosage: m.dosage || "Not detected",
                  form: "tablet",
                  unit: "pills",
                  current_stock: 1,
                  min_stock_alert: 5,
                });
              });
              fetchMedicines();
            }}
          >
            Add to Medicines
          </Button>
        </div>
      )}

      {/* SEARCH */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" />
          <Input
            placeholder="Search medicines..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
      </div>

      {/* LIST */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {medicines?.map((med) => (
            <motion.div key={med.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card>
                <CardContent className="p-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{med.name}</h3>
                      <p className="text-sm text-muted-foreground">{med.dosage}</p>
                    </div>

                    {/* ACTION MENU */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <MoreVertical className="h-4 w-4 cursor-pointer" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedMedicine(med);
                            setFormDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => {
                            setSelectedMedicine(med);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="mt-4 text-sm">
                    Stock: {med.currentStock} {med.unit}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* DIALOGS */}
      <MedicineFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        medicine={selectedMedicine}
        preFillFromPrescription={pendingMissingMedicine || undefined}
        onSuccess={() => {
          fetchMedicines();
          refetchMissing();
        }}
      />

      <DeleteMedicineDialog
        medicine={selectedMedicine}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onSuccess={fetchMedicines}
      />

      {/* MISSING SECTION */}
      {missingMedicines?.length > 0 && (
        <div className="mt-10">
          <h2 className="flex items-center gap-2 text-lg font-semibold mb-4">
            <AlertTriangle className="text-amber-500" />
            Missing from Inventory
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {missingMedicines.map((med) => (
              <MissingMedicineCard
                key={med.id}
                medicine={med}
                onAddToInventory={(m) => {
                  setPendingMissingMedicine(m);
                  setFormDialogOpen(true);
                }}
                onHide={() => refetchMissing()}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 
