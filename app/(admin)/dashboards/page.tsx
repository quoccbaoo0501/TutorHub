import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminDashboardPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard Overview</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 text-2xl">1,200</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Classes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 text-2xl">150</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Contracts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 text-2xl">500</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue (MTD)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 text-2xl">$15,000</p>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

