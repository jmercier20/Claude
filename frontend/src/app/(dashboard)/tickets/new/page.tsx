'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ArrowLeft, Ticket } from 'lucide-react';
import api from '@/lib/api';

const schema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  category: z.string().min(1, 'Category is required'),
  department: z.string().min(1, 'Department is required'),
  priority: z.string().default('MEDIUM'),
  assigneeId: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const CATEGORIES = ['TECHNICAL', 'CLAIMS', 'FRAUD', 'BILLING', 'ACCOUNT', 'GENERAL', 'COMPLAINT', 'FEEDBACK'];
const DEPARTMENTS = ['TECHNICAL', 'CLAIMS', 'FRAUD', 'BILLING', 'GENERAL', 'MANAGEMENT', 'COMPLIANCE'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT', 'CRITICAL'];

export default function NewTicketPage() {
  const router = useRouter();
  const [customerSearch, setCustomerSearch] = useState('');

  const { data: customersData } = useQuery({
    queryKey: ['customers', 'search', customerSearch],
    queryFn: () => api.get(`/customers?search=${customerSearch}&limit=10`) as Promise<any>,
    enabled: customerSearch.length > 2,
  });

  const { data: agentsData } = useQuery({
    queryKey: ['agents'],
    queryFn: () => api.get('/users?status=ACTIVE&limit=100') as Promise<any>,
  });

  const customers = customersData?.data || [];
  const agents = agentsData?.data || [];

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { priority: 'MEDIUM' },
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) => api.post('/tickets', data) as Promise<any>,
    onSuccess: (result: any) => {
      toast.success(`Ticket ${result.data.ticketId} created successfully!`);
      router.push(`/tickets/${result.data.id}`);
    },
    onError: () => toast.error('Failed to create ticket'),
  });

  const selectedCustomerId = watch('customerId');

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create New Ticket</h1>
          <p className="text-gray-500 text-sm">Fill in the details to create a support ticket</p>
        </div>
      </div>

      <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-5">
        {/* Customer Selection */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
            <span className="w-5 h-5 bg-lisa-100 text-lisa-600 rounded text-xs flex items-center justify-center font-bold">1</span>
            Customer
          </h3>

          <div>
            <input
              type="text"
              placeholder="Search customer by name, email, or ID..."
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-lisa-500"
            />
            {customers.length > 0 && (
              <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden">
                {customers.map((c: any) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setValue('customerId', c.id);
                      setCustomerSearch(`${c.firstName} ${c.lastName} (${c.customerId})`);
                    }}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors ${selectedCustomerId === c.id ? 'bg-lisa-50 text-lisa-700' : ''}`}
                  >
                    <span className="font-medium">{c.firstName} {c.lastName}</span>
                    <span className="text-gray-400 text-xs ml-2">{c.customerId} • {c.email}</span>
                  </button>
                ))}
              </div>
            )}
            {errors.customerId && <p className="text-red-500 text-xs mt-1">{errors.customerId.message}</p>}
          </div>
        </div>

        {/* Ticket Details */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
            <span className="w-5 h-5 bg-lisa-100 text-lisa-600 rounded text-xs flex items-center justify-center font-bold">2</span>
            Ticket Details
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
              <input
                {...register('title')}
                placeholder="Brief summary of the issue"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-lisa-500"
              />
              {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description *</label>
              <textarea
                {...register('description')}
                rows={4}
                placeholder="Detailed description of the issue..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-lisa-500 resize-none"
              />
              {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category *</label>
                <select {...register('category')} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-lisa-500">
                  <option value="">Select category</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Department *</label>
                <select {...register('department')} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-lisa-500">
                  <option value="">Select department</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                {errors.department && <p className="text-red-500 text-xs mt-1">{errors.department.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
                <select {...register('priority')} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-lisa-500">
                  {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assign To</label>
                <select {...register('assigneeId')} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-lisa-500">
                  <option value="">Auto-assign</option>
                  {agents.map((a: any) => (
                    <option key={a.id} value={a.id}>{a.firstName} {a.lastName} ({a.role})</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-lisa-500 hover:bg-lisa-600 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Ticket className="w-4 h-4" />
            {mutation.isPending ? 'Creating...' : 'Create Ticket'}
          </button>
        </div>
      </form>
    </div>
  );
}
