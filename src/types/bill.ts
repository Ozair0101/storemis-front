export interface BillItem {
  name: string;
  quantity: number;
  unit_price: number;
}

export interface BillData {
  purchase_id: number;
  invoice_number?: string | null;
  supplier_name: string;
  payment_type: string;
  created_at: string;
  due_date?: string | null;
  items: BillItem[];
  total_amount: number;
  paid_amount: number;
}
