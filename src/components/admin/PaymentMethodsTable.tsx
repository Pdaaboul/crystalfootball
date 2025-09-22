'use client';

import { PaymentMethodWithFields } from '@/lib/types/payment-methods';
import { 
  getPaymentTypeClasses, 
  getPaymentTypeDisplayText,
  getPaymentMethodDisplayName,
  formatTimestamp
} from '@/lib/utils/payment-methods';

interface PaymentMethodsTableProps {
  methods: PaymentMethodWithFields[];
}

export function PaymentMethodsTable({ methods }: PaymentMethodsTableProps) {
  if (methods.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">💰</span>
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">No Payment Methods</h3>
        <p className="text-muted-foreground">
          Create your first payment method to enable user payments.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-muted/30">
          <tr>
            <th className="text-left p-4 font-medium text-foreground">Method</th>
            <th className="text-left p-4 font-medium text-foreground">Type</th>
            <th className="text-left p-4 font-medium text-foreground">Status</th>
            <th className="text-left p-4 font-medium text-foreground">Fields</th>
            <th className="text-left p-4 font-medium text-foreground">Updated</th>
            <th className="text-left p-4 font-medium text-foreground">Actions</th>
          </tr>
        </thead>
        <tbody>
          {methods.map((method) => (
            <tr key={method.id} className="border-t border-border hover:bg-muted/10">
              <td className="p-4">
                <div>
                  <div className="font-medium text-foreground">{method.label}</div>
                  <div className="text-sm text-muted-foreground">
                    {getPaymentMethodDisplayName(method)}
                  </div>
                </div>
              </td>
              <td className="p-4">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getPaymentTypeClasses(method.type)}`}>
                  {getPaymentTypeDisplayText(method.type)}
                </span>
              </td>
              <td className="p-4">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
                  method.is_active 
                    ? 'bg-success/10 text-success border-success/20' 
                    : 'bg-muted text-muted-foreground border-border'
                }`}>
                  {method.is_active ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className="p-4">
                <div className="text-sm text-muted-foreground">
                  {method.fields.length} field{method.fields.length !== 1 ? 's' : ''}
                </div>
              </td>
              <td className="p-4">
                <div className="text-sm text-foreground">
                  {formatTimestamp(method.updated_at)}
                </div>
              </td>
              <td className="p-4">
                <div className="flex space-x-2">
                  <button className="text-cyan-blue hover:text-cyan-blue/80 text-sm font-medium focus-visible-cyan">
                    Edit
                  </button>
                  <button className={`text-sm font-medium focus-visible-cyan ${
                    method.is_active 
                      ? 'text-muted-foreground hover:text-foreground' 
                      : 'text-success hover:text-success/80'
                  }`}>
                    {method.is_active ? 'Disable' : 'Enable'}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 