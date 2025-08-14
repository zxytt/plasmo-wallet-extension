/*
 * @Author: big-bamp 1528912119@qq.com
 * @Date: 2025-08-14 16:59:29
 * @LastEditors: big-bamp 1528912119@qq.com
 * @LastEditTime: 2025-08-14 17:36:16
 * @FilePath: /wallet/src/components/Layout.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import React from "react"

interface LayoutProps {
  children: React.ReactNode
  title?: string
}

export function Layout({ children, title }: LayoutProps) {
  return (
    <div 
      style={{ 
        width: '420px', 
        minHeight: '500px',
        maxWidth: '420px',
        minWidth: '420px'
      }} 
      className="bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col shadow-xl"
    >
      {title && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 text-center font-semibold shadow-lg">
          <div className="flex items-center justify-center space-x-2">
            <span className="text-xl">🔐</span>
            <span>{title}</span>
          </div>
        </div>
      )}
      <div className="flex-1 p-6 overflow-y-auto">
        {children}
      </div>
    </div>
  )
}