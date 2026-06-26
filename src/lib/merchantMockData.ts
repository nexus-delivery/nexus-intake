export interface Merchant {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: "active" | "inactive" | "pending";
  joinDate: string;
  ordersCount: number;
  revenue: number;
}

export interface MerchantStats {
  totalOrders: number;
  activeShipments: number;
  revenue: number;
  averageRating: number;
}

export const merchantMockData: Merchant[] = [
  {
    id: "M001",
    name: "Fresh Mart Grocery",
    email: "contact@freshmart.com",
    phone: "+1 (555) 234-5678",
    status: "active",
    joinDate: "2024-01-15",
    ordersCount: 342,
    revenue: 125400,
  },
  {
    id: "M002",
    name: "Urban Eats Restaurant",
    email: "orders@urbaneats.com",
    phone: "+1 (555) 345-6789",
    status: "active",
    joinDate: "2024-02-20",
    ordersCount: 521,
    revenue: 298700,
  },
  {
    id: "M003",
    name: "Quick Pharmacy Plus",
    email: "support@quickpharm.com",
    phone: "+1 (555) 456-7890",
    status: "active",
    joinDate: "2024-03-10",
    ordersCount: 189,
    revenue: 76300,
  },
];

export const merchantStatsMockData: MerchantStats = {
  totalOrders: 1052,
  activeShipments: 47,
  revenue: 500400,
  averageRating: 4.6,
};