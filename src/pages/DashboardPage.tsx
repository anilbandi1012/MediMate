import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Pill, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import PageHeader from '@/components/common/PageHeader';
import DashboardStats from '@/components/dashboard/DashboardStats';
import UpcomingReminders from '@/components/dashboard/UpcomingReminders';
import LowStockAlert from '@/components/inventory/LowStockAlert';
import AdherenceChart from '@/components/analytics/AdherenceChart';
import QuickActions from '@/components/dashboard/QuickActions';
import { useAuth } from '@/contexts/AuthContext';
import { getGreeting } from '@/lib/utils';
import { ROUTES } from '@/lib/constants';

export default function DashboardPage() {
  const { user } = useAuth();
  const greeting = getGreeting();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  const subscribeUser = async () => {

    try {
      const registration = await navigator.serviceWorker.ready;

      const permission = await Notification.requestPermission();

      if (permission !== "granted") {
        alert("Notification permission denied");
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array("BFapiROU-4n2Now3HdPm9UBz0jKtYdYAbGW7vw5NyNzmTFonZG3fiXExZmzyUk-xC7-wSA7mEQWsVwyi6IJMTNU")
      });

      await fetch("http://localhost:8000/api/v1/subscription/save-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(subscription)
      });

      alert("Push notifications enabled ✅");

    } catch (error) {
      console.error("Subscription error:", error);
    }
  };


  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <PageHeader
          title={`${greeting}, ${user?.name?.split(' ')[0] || 'there'}!`}
          description="Here's an overview of your medication schedule"
        >
          <Link to={ROUTES.MEDICINES}>
            <Button className="gradient-primary">
              <Plus className="h-4 w-4 mr-2" />
              Add Medicine
            </Button>
          </Link>
        </PageHeader>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={itemVariants}>
        <DashboardStats />
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants}>
        <QuickActions />
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Reminders */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <UpcomingReminders />
        </motion.div>

        {/* Low Stock Alerts */}
        <motion.div variants={itemVariants}>
          <LowStockAlert />
        </motion.div>
      </div>

      {/* Adherence Chart */}
      {/* <motion.div variants={itemVariants}>
        <AdherenceChart />
      </motion.div> */}
      <button onClick={subscribeUser}>
        Enable Notifications
      </button>
    </motion.div>

  );
}
