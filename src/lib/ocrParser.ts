// lib/ocrParser.ts

export type ParsedMedicine = {
    name: string;
    dosage?: string;
    frequency?: string;
    duration?: string;
};

const MED_WORDS = ["tab", "cap", "syp", "inj", "drop", "cream", "gel"];

const FREQ_WORDS = [
    "morning",
    "night",
    "evening",
    "afternoon",
    "daily",
    "twice",
    "thrice",
    "once",
];

const PHARMACY_WORDS = [
    "sig",
    "dispense",
    "supply",
    "tot",
    "qty",
    "quantity",
    "refill",
    "prn",
    "stat",
    "repeat",
    "days",
    "day",
    "weeks",
    "week",
    "months",
    "month",
];

const STOP_WORDS = [
    "oral",
    "hours",
    "hour",
    "tablet",
    "capsule",
    "extended",
    "release",
    "start",
    "date",
    "take",
    "times",
    "daily",
    "morning",
    "night",
    "evening",
    "afternoon",
    "before",
    "after",
    "food",
    "dose",
    "doses",
    "every",
    "for",
    ...PHARMACY_WORDS
];


export function parseMedicinesFromOCR(raw: any): ParsedMedicine[] {
    if (!raw) return [];

    // Force everything into string safely
    const text =
        typeof raw === "string"
            ? raw
            : Array.isArray(raw)
                ? raw.join("\n")
                : JSON.stringify(raw);

    const lines = text
        .split("\n")
        .map(l => (l ? String(l).trim() : ""))
        .filter(l => l.length > 3);

    const results: ParsedMedicine[] = [];

    for (let original of lines) {
        const lower = original.toLowerCase();

        if (!MED_WORDS.some(w => lower.includes(w))) continue;

        const dosageMatch = original.match(/\d+\s?(mg|ml|mcg)/i);
        const freqMatch =
            original.match(/\b(\d-\d-\d|od|bd|tds|hs)\b/i) ||
            original.match(
                new RegExp(`\\b(${FREQ_WORDS.join("|")})\\b`, "gi")
            );

        const durationMatch = original.match(
            /\b\d+\s?(days|weeks|months)\b/i
        );

        let clean = original
            .replace(/\d+\s?(mg|ml|mcg|g)/gi, "")
            .replace(/\b(tab|cap|syp|inj|drop|cream|gel)\b/gi, "")
            .replace(/\b\d+\b/g, "") // remove pure numbers
            .replace(
                new RegExp(`\\b(${FREQ_WORDS.join("|")})\\b`, "gi"),
                ""
            )
            .replace(/\b(days|weeks|months)\b/gi, "")
            .replace(/[^a-zA-Z ]/g, " ")
            .replace(/\s+/g, " ")
            .trim();

        let tokens = clean.split(" ");

        const finalNameTokens = [];
        for (let t of tokens) {
            if (STOP_WORDS.includes(t.toLowerCase())) break;
            finalNameTokens.push(t);
        }

        // Limit to max 3 words (real drug names never exceed this)
        let finalName = finalNameTokens.slice(0, 3).join(" ");

        if (!finalName || finalName.length < 3) continue;


        results.push({
            name: finalName.toUpperCase(),
            dosage: dosageMatch?.[0] || "1",
            frequency:
                freqMatch?.join(" ") ||
                freqMatch?.[0] ||
                "Once a day",
            duration: durationMatch?.[0],
        });
    }

    return results;
}
