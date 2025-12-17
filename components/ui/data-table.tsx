import type React from "react"
import { cn } from "@/lib/utils"

interface Column<T> {
  header: string
  accessor: keyof T | ((row: T) => React.ReactNode)
  className?: string
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  className?: string
}

export function DataTable<T extends { id: string }>({ data, columns, className }: DataTableProps<T>) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-white/10">
            {columns.map((column, index) => (
              <th key={index} className="pb-3 text-sm font-medium text-gray-400">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {data.map((row) => (
            <tr key={row.id} className="group hover:bg-white/5 transition-colors">
              {columns.map((column, index) => (
                <td key={index} className={cn("py-4 text-sm", column.className)}>
                  {typeof column.accessor === "function" ? column.accessor(row) : String(row[column.accessor])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
