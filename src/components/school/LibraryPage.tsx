'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen, Plus, Search, Grid, List, Library, AlertTriangle,
  ArrowLeftRight, Calendar, User, Hash, Clock, CheckCircle2,
  BookMarked, TrendingUp, Layers
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'

// Types
interface Book {
  id: string
  title: string
  author: string
  category: string
  isbn: string
  totalCopies: number
  availableCopies: number
  color: string
}

interface BorrowRecord {
  id: string
  studentName: string
  bookTitle: string
  borrowDate: string
  dueDate: string
  returnDate: string | null
  status: 'معار' | 'مرجع' | 'متأخر'
}

// Category colors
const CATEGORY_COLORS: Record<string, { bg: string; dot: string; text: string; bar: string }> = {
  'أدب': { bg: 'bg-rose-50 border-rose-200 dark:bg-rose-950/20 dark:border-rose-700', dot: 'bg-rose-500', text: 'text-rose-700 dark:text-rose-300', bar: '#e11d48' },
  'علوم': { bg: 'bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-700', dot: 'bg-blue-500', text: 'text-blue-700 dark:text-blue-300', bar: '#2563eb' },
  'تاريخ': { bg: 'bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-700', dot: 'bg-amber-500', text: 'text-amber-700 dark:text-amber-300', bar: '#d97706' },
  'دين': { bg: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-700', dot: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-300', bar: '#059669' },
  'لغات': { bg: 'bg-purple-50 border-purple-200 dark:bg-purple-950/20 dark:border-purple-700', dot: 'bg-purple-500', text: 'text-purple-700 dark:text-purple-300', bar: '#7c3aed' },
  'تربية': { bg: 'bg-teal-50 border-teal-200 dark:bg-teal-950/20 dark:border-teal-700', dot: 'bg-teal-500', text: 'text-teal-700 dark:text-teal-300', bar: '#0d9488' },
}
const DEFAULT_CATEGORY = { bg: 'bg-gray-50 border-gray-200 dark:bg-gray-900/20 dark:border-gray-700', dot: 'bg-gray-400', text: 'text-gray-700 dark:text-gray-300', bar: '#6b7280' }

const BOOK_COLORS = [
  '#0d9488', '#059669', '#2563eb', '#7c3aed', '#d97706',
  '#e11d48', '#0891b2', '#4f46e5', '#dc2626', '#16a34a',
  '#9333ea', '#c2410c', '#0284c7', '#be185d', '#15803d',
  '#6d28d9', '#b45309', '#0e7490',
]

// Mock books data
const mockBooks: Book[] = [
  { id: 'b1', title: 'ألف ليلة وليلة', author: 'مجهول', category: 'أدب', isbn: '978-1-234567-01-1', totalCopies: 5, availableCopies: 3, color: BOOK_COLORS[0] },
  { id: 'b2', title: 'فيزياء الصف السادس', author: 'د. أحمد الربيعي', category: 'علوم', isbn: '978-1-234567-02-8', totalCopies: 30, availableCopies: 22, color: BOOK_COLORS[1] },
  { id: 'b3', title: 'تاريخ العراق الحديث', author: 'د. عبد الرحمن الجبري', category: 'تاريخ', isbn: '978-1-234567-03-5', totalCopies: 8, availableCopies: 2, color: BOOK_COLORS[2] },
  { id: 'b4', title: 'تفسير القرآن الكريم', author: 'ابن كثير', category: 'دين', isbn: '978-1-234567-04-2', totalCopies: 10, availableCopies: 7, color: BOOK_COLORS[3] },
  { id: 'b5', title: 'قواعد اللغة الانكليزية', author: 'م. سارة العبيدي', category: 'لغات', isbn: '978-1-234567-05-9', totalCopies: 25, availableCopies: 18, color: BOOK_COLORS[4] },
  { id: 'b6', title: 'أسس التربية الحديثة', author: 'د. فاطمة الموسوي', category: 'تربية', isbn: '978-1-234567-06-6', totalCopies: 6, availableCopies: 4, color: BOOK_COLORS[5] },
  { id: 'b7', title: 'ديوان المتنبي', author: 'أبو الطيب المتنبي', category: 'أدب', isbn: '978-1-234567-07-3', totalCopies: 4, availableCopies: 1, color: BOOK_COLORS[6] },
  { id: 'b8', title: 'الكيمياء العضوية', author: 'د. حسين الشمري', category: 'علوم', isbn: '978-1-234567-08-0', totalCopies: 20, availableCopies: 15, color: BOOK_COLORS[7] },
  { id: 'b9', title: 'حضارة بلاد الرافدين', author: 'د. نوري العاني', category: 'تاريخ', isbn: '978-1-234567-09-7', totalCopies: 7, availableCopies: 5, color: BOOK_COLORS[8] },
  { id: 'b10', title: 'رياضيات الصف الخامس', author: 'د. كاظم الحسيني', category: 'علوم', isbn: '978-1-234567-10-3', totalCopies: 35, availableCopies: 28, color: BOOK_COLORS[9] },
  { id: 'b11', title: 'الفقه الميسر', author: 'السيد محمد بحر العلوم', category: 'دين', isbn: '978-1-234567-11-0', totalCopies: 12, availableCopies: 9, color: BOOK_COLORS[10] },
  { id: 'b12', title: 'النحو الواضح', author: 'علي الجارم', category: 'لغات', isbn: '978-1-234567-12-7', totalCopies: 18, availableCopies: 10, color: BOOK_COLORS[11] },
  { id: 'b13', title: 'علم النفس التربوي', author: 'د. هدى الخفاجي', category: 'تربية', isbn: '978-1-234567-13-4', totalCopies: 9, availableCopies: 6, color: BOOK_COLORS[12] },
  { id: 'b14', title: 'أدب الأطفال العربي', author: 'كامل كيلاني', category: 'أدب', isbn: '978-1-234567-14-1', totalCopies: 6, availableCopies: 0, color: BOOK_COLORS[13] },
  { id: 'b15', title: 'الأحياء للمرحلة المتوسطة', author: 'د. زينب العاملي', category: 'علوم', isbn: '978-1-234567-15-8', totalCopies: 22, availableCopies: 14, color: BOOK_COLORS[14] },
  { id: 'b16', title: 'الجغرافية الطبيعية', author: 'د. محمد الربيعي', category: 'تاريخ', isbn: '978-1-234567-16-5', totalCopies: 11, availableCopies: 8, color: BOOK_COLORS[15] },
  { id: 'b17', title: 'الحديث النبوي الشريف', author: 'الإمام النووي', category: 'دين', isbn: '978-1-234567-17-2', totalCopies: 14, availableCopies: 11, color: BOOK_COLORS[16] },
]

// Mock borrowing records
const mockBorrowRecords: BorrowRecord[] = [
  { id: 'br1', studentName: 'أحمد محمد علي', bookTitle: 'ألف ليلة وليلة', borrowDate: '2025-01-15', dueDate: '2025-02-15', returnDate: null, status: 'متأخر' },
  { id: 'br2', studentName: 'فاطمة حسين جاسم', bookTitle: 'فيزياء الصف السادس', borrowDate: '2025-02-01', dueDate: '2025-03-01', returnDate: null, status: 'معار' },
  { id: 'br3', studentName: 'عمر ياسر خلف', bookTitle: 'تاريخ العراق الحديث', borrowDate: '2025-01-10', dueDate: '2025-02-10', returnDate: '2025-02-08', status: 'مرجع' },
  { id: 'br4', studentName: 'زينب عبد الله', bookTitle: 'ديوان المتنبي', borrowDate: '2025-01-20', dueDate: '2025-02-20', returnDate: null, status: 'متأخر' },
  { id: 'br5', studentName: 'مريم سعيد', bookTitle: 'قواعد اللغة الانكليزية', borrowDate: '2025-02-10', dueDate: '2025-03-10', returnDate: null, status: 'معار' },
  { id: 'br6', studentName: 'بلال عمار حسن', bookTitle: 'أسس التربية الحديثة', borrowDate: '2025-01-05', dueDate: '2025-02-05', returnDate: '2025-02-03', status: 'مرجع' },
  { id: 'br7', studentName: 'نور الهدى كاظم', bookTitle: 'أدب الأطفال العربي', borrowDate: '2025-01-25', dueDate: '2025-02-25', returnDate: null, status: 'متأخر' },
  { id: 'br8', studentName: 'ياسر وليد', bookTitle: 'الكيمياء العضوية', borrowDate: '2025-02-15', dueDate: '2025-03-15', returnDate: null, status: 'معار' },
  { id: 'br9', studentName: 'حسينة عباس', bookTitle: 'النحو الواضح', borrowDate: '2025-02-05', dueDate: '2025-03-05', returnDate: null, status: 'معار' },
  { id: 'br10', studentName: 'علي حسين جاسم', bookTitle: 'حضارة بلاد الرافدين', borrowDate: '2025-01-08', dueDate: '2025-02-08', returnDate: '2025-02-06', status: 'مرجع' },
  { id: 'br11', studentName: 'رعد قاسم', bookTitle: 'ألف ليلة وليلة', borrowDate: '2025-01-18', dueDate: '2025-02-18', returnDate: null, status: 'متأخر' },
  { id: 'br12', studentName: 'سارة نبيل', bookTitle: 'رياضيات الصف الخامس', borrowDate: '2025-02-20', dueDate: '2025-03-20', returnDate: null, status: 'معار' },
]

const STATUS_COLORS: Record<string, string> = {
  'معار': 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700',
  'مرجع': 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700',
  'متأخر': 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700',
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 }
}

// Category distribution chart data
function getCategoryDistribution(books: Book[]) {
  const categories = ['أدب', 'علوم', 'تاريخ', 'دين', 'لغات', 'تربية']
  return categories.map(cat => {
    const catBooks = books.filter(b => b.category === cat)
    const totalCopies = catBooks.reduce((sum, b) => sum + b.totalCopies, 0)
    const available = catBooks.reduce((sum, b) => sum + b.availableCopies, 0)
    return { category: cat, total: totalCopies, available, count: catBooks.length }
  })
}

export default function LibraryPage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('catalog')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [addBookOpen, setAddBookOpen] = useState(false)
  const [addBorrowOpen, setAddBorrowOpen] = useState(false)
  const [books, setBooks] = useState<Book[]>(mockBooks)
  const [borrowRecords, setBorrowRecords] = useState<BorrowRecord[]>(mockBorrowRecords)

  // Book form
  const [bookForm, setBookForm] = useState({
    title: '',
    author: '',
    category: 'أدب',
    isbn: '',
    totalCopies: 1,
    availableCopies: 1,
  })

  // Borrow form
  const [borrowForm, setBorrowForm] = useState({
    studentName: '',
    bookId: '',
    borrowDate: new Date().toISOString().split('T')[0],
    dueDate: '',
  })

  // Stats
  const totalBooks = books.reduce((sum, b) => sum + b.totalCopies, 0)
  const availableBooks = books.reduce((sum, b) => sum + b.availableCopies, 0)
  const borrowedBooks = totalBooks - availableBooks
  const overdueCount = borrowRecords.filter(r => r.status === 'متأخر').length

  // Filtered books
  const filteredBooks = books.filter(b => {
    if (filterCategory !== 'all' && b.category !== filterCategory) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q)
    }
    return true
  })

  // Overdue books
  const overdueBooks = borrowRecords.filter(r => r.status === 'متأخر')

  // Category distribution
  const categoryDist = getCategoryDistribution(books)
  const maxCatTotal = Math.max(...categoryDist.map(c => c.total))

  const handleAddBook = () => {
    if (!bookForm.title || !bookForm.author) {
      toast({ title: 'تنبيه', description: 'اسم الكتاب والمؤلف مطلوبان', variant: 'destructive' })
      return
    }
    const newBook: Book = {
      id: `b-${Date.now()}`,
      ...bookForm,
      color: BOOK_COLORS[Math.floor(Math.random() * BOOK_COLORS.length)],
    }
    setBooks(prev => [...prev, newBook])
    setAddBookOpen(false)
    setBookForm({ title: '', author: '', category: 'أدب', isbn: '', totalCopies: 1, availableCopies: 1 })
    toast({ title: 'تمت الإضافة', description: 'تم إضافة الكتاب بنجاح' })
  }

  const handleAddBorrow = () => {
    if (!borrowForm.studentName || !borrowForm.bookId || !borrowForm.dueDate) {
      toast({ title: 'تنبيه', description: 'جميع الحقول مطلوبة', variant: 'destructive' })
      return
    }
    const book = books.find(b => b.id === borrowForm.bookId)
    if (!book || book.availableCopies <= 0) {
      toast({ title: 'تنبيه', description: 'لا توجد نسخ متاحة من هذا الكتاب', variant: 'destructive' })
      return
    }
    const newRecord: BorrowRecord = {
      id: `br-${Date.now()}`,
      studentName: borrowForm.studentName,
      bookTitle: book.title,
      borrowDate: borrowForm.borrowDate,
      dueDate: borrowForm.dueDate,
      returnDate: null,
      status: 'معار',
    }
    setBorrowRecords(prev => [newRecord, ...prev])
    setBooks(prev => prev.map(b => b.id === borrowForm.bookId ? { ...b, availableCopies: b.availableCopies - 1 } : b))
    setAddBorrowOpen(false)
    setBorrowForm({ studentName: '', bookId: '', borrowDate: new Date().toISOString().split('T')[0], dueDate: '' })
    toast({ title: 'تم التسجيل', description: 'تم تسجيل الإعارة بنجاح' })
  }

  const handleReturnBook = (recordId: string) => {
    setBorrowRecords(prev => prev.map(r => r.id === recordId ? { ...r, returnDate: new Date().toISOString().split('T')[0], status: 'مرجع' as const } : r))
    const record = borrowRecords.find(r => r.id === recordId)
    if (record) {
      const book = books.find(b => b.title === record.bookTitle)
      if (book) {
        setBooks(prev => prev.map(b => b.id === book.id ? { ...b, availableCopies: b.availableCopies + 1 } : b))
      }
    }
    toast({ title: 'تم الإرجاع', description: 'تم تسجيل إرجاع الكتاب بنجاح' })
  }

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-xl shadow-lg"
            style={{ background: 'linear-gradient(135deg, #0d9488, #059669)' }}
          >
            <BookOpen className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold dark:text-gray-200">إدارة المكتبة</h1>
            <p className="text-sm text-muted-foreground">إدارة الكتب والإعارات</p>
          </div>
        </div>
      </motion.div>

      {/* Summary Stat Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-teal-200 dark:border-gray-700 overflow-hidden relative">
          <div className="h-1" style={{ background: 'linear-gradient(90deg, #0d9488, #059669)' }} />
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center shrink-0">
              <Library className="h-6 w-6 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">إجمالي الكتب</p>
              <p className="text-2xl font-bold text-teal-700 dark:text-teal-300">{totalBooks}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-emerald-200 dark:border-gray-700 overflow-hidden relative">
          <div className="h-1" style={{ background: 'linear-gradient(90deg, #059669, #10b981)' }} />
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
              <BookMarked className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">متاح</p>
              <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{availableBooks}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-200 dark:border-gray-700 overflow-hidden relative">
          <div className="h-1" style={{ background: 'linear-gradient(90deg, #d97706, #f59e0b)' }} />
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
              <ArrowLeftRight className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">معار</p>
              <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{borrowedBooks}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-200 dark:border-gray-700 overflow-hidden relative">
          <div className="h-1" style={{ background: 'linear-gradient(90deg, #dc2626, #ef4444)' }} />
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/40 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">متأخر</p>
              <p className="text-2xl font-bold text-red-700 dark:text-red-300">{overdueCount}</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Overdue Books Alert */}
      {overdueBooks.length > 0 && (
        <motion.div variants={itemVariants}>
          <Card className="border-red-300 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 dark:border-red-800 overflow-hidden">
            <div className="h-1" style={{ background: 'linear-gradient(90deg, #dc2626, #ef4444)' }} />
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 text-red-700 dark:text-red-400">
                <AlertTriangle className="h-5 w-5" />
                كتب متأخرة عن الإرجاع ({overdueBooks.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {overdueBooks.map(record => (
                  <Badge key={record.id} variant="outline" className="bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700 gap-1 py-1 px-2">
                    <User className="h-3 w-3" />
                    {record.studentName} - {record.bookTitle}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Main Tabs */}
      <motion.div variants={itemVariants}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="catalog" className="gap-1.5">
              <BookOpen className="h-4 w-4" />
              فهرس الكتب
            </TabsTrigger>
            <TabsTrigger value="borrowing" className="gap-1.5">
              <ArrowLeftRight className="h-4 w-4" />
              سجل الإعارات
            </TabsTrigger>
            <TabsTrigger value="stats" className="gap-1.5">
              <TrendingUp className="h-4 w-4" />
              الإحصائيات
            </TabsTrigger>
          </TabsList>

          {/* Book Catalog Tab */}
          <TabsContent value="catalog" className="space-y-4">
            {/* Filters */}
            <Card className="dark:bg-gray-900/50 dark:border-gray-700">
              <div className="h-1" style={{ background: 'linear-gradient(90deg, #0d9488, #059669)' }} />
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-4 items-end">
                  <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="بحث بعنوان الكتاب أو المؤلف..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pr-9 dark:bg-gray-800 dark:border-gray-600"
                      />
                    </div>
                  </div>
                  <div className="min-w-[160px]">
                    <Select value={filterCategory} onValueChange={setFilterCategory}>
                      <SelectTrigger className="dark:bg-gray-800 dark:border-gray-600">
                        <SelectValue placeholder="التصنيف" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">جميع التصنيفات</SelectItem>
                        <SelectItem value="أدب">أدب</SelectItem>
                        <SelectItem value="علوم">علوم</SelectItem>
                        <SelectItem value="تاريخ">تاريخ</SelectItem>
                        <SelectItem value="دين">دين</SelectItem>
                        <SelectItem value="لغات">لغات</SelectItem>
                        <SelectItem value="تربية">تربية</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant={viewMode === 'grid' ? 'default' : 'outline'}
                      className="h-8 w-8"
                      onClick={() => setViewMode('grid')}
                    >
                      <Grid className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant={viewMode === 'list' ? 'default' : 'outline'}
                      className="h-8 w-8"
                      onClick={() => setViewMode('list')}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button
                    onClick={() => setAddBookOpen(true)}
                    className="gap-2"
                    style={{ background: 'linear-gradient(135deg, #0d9488, #059669)' }}
                  >
                    <Plus className="h-4 w-4" />
                    إضافة كتاب
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Book Grid/List */}
            {filteredBooks.length === 0 ? (
              <Card className="dark:bg-gray-900/50 dark:border-gray-700">
                <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mb-4 opacity-30" />
                  <p className="text-lg font-medium">لا توجد كتب</p>
                  <p className="text-sm">قم بتغيير معايير البحث أو أضف كتباً جديدة</p>
                </CardContent>
              </Card>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredBooks.map((book, idx) => {
                  const catColor = CATEGORY_COLORS[book.category] || DEFAULT_CATEGORY
                  const availability = book.totalCopies > 0 ? Math.round((book.availableCopies / book.totalCopies) * 100) : 0
                  return (
                    <motion.div
                      key={book.id}
                      variants={itemVariants}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.02 }}
                      whileHover={{ y: -3, boxShadow: '0 8px 25px -5px rgba(13, 148, 136, 0.12)' }}
                    >
                      <Card className={cn('overflow-hidden relative dark:bg-gray-900/50 dark:border-gray-700 hover:shadow-lg transition-all', catColor.bg)}>
                        <div className="h-1" style={{ background: `linear-gradient(90deg, ${book.color}, ${book.color}aa)` }} />
                        <CardContent className="p-4">
                          {/* Book cover indicator */}
                          <div className="flex items-start gap-3 mb-3">
                            <div
                              className="w-10 h-14 rounded-md flex items-center justify-center shrink-0 shadow-md"
                              style={{ background: `linear-gradient(135deg, ${book.color}, ${book.color}cc)` }}
                            >
                              <BookOpen className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-sm leading-tight truncate dark:text-gray-200">{book.title}</h3>
                              <p className="text-xs text-muted-foreground mt-0.5">{book.author}</p>
                            </div>
                          </div>

                          {/* Category badge */}
                          <div className="flex items-center gap-2 mb-3">
                            <Badge variant="outline" className={cn('text-[10px]', catColor.bg, catColor.text)}>
                              <div className={cn('w-1.5 h-1.5 rounded-full ml-1', catColor.dot)} />
                              {book.category}
                            </Badge>
                          </div>

                          {/* ISBN */}
                          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-2" dir="ltr">
                            <Hash className="h-3 w-3" />
                            <span>{book.isbn}</span>
                          </div>

                          {/* Copies info */}
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">النسخ المتاحة</span>
                              <span className={cn('font-medium', book.availableCopies === 0 ? 'text-red-600 dark:text-red-400' : 'text-teal-600 dark:text-teal-400')}>
                                {book.availableCopies} / {book.totalCopies}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                              <motion.div
                                className="h-1.5 rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${availability}%` }}
                                transition={{ duration: 0.6, delay: idx * 0.03 }}
                                style={{
                                  background: availability > 50 ? 'linear-gradient(90deg, #059669, #10b981)' :
                                    availability > 20 ? 'linear-gradient(90deg, #d97706, #f59e0b)' :
                                    'linear-gradient(90deg, #dc2626, #ef4444)'
                                }}
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </div>
            ) : (
              <Card className="overflow-hidden dark:bg-gray-900/50 dark:border-gray-700">
                <div className="h-1" style={{ background: 'linear-gradient(90deg, #0d9488, #059669)' }} />
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>الكتاب</TableHead>
                          <TableHead>المؤلف</TableHead>
                          <TableHead className="text-center">التصنيف</TableHead>
                          <TableHead className="text-center" dir="ltr">ISBN</TableHead>
                          <TableHead className="text-center">الإجمالي</TableHead>
                          <TableHead className="text-center">المتاح</TableHead>
                          <TableHead className="text-center">الحالة</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredBooks.map((book) => {
                          const catColor = CATEGORY_COLORS[book.category] || DEFAULT_CATEGORY
                          return (
                            <TableRow key={book.id} className="dark:hover:bg-gray-800/50">
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-8 h-10 rounded-md flex items-center justify-center shrink-0"
                                    style={{ background: `linear-gradient(135deg, ${book.color}, ${book.color}cc)` }}
                                  >
                                    <BookOpen className="h-3.5 w-3.5 text-white" />
                                  </div>
                                  <span className="font-medium text-sm dark:text-gray-200">{book.title}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">{book.author}</TableCell>
                              <TableCell className="text-center">
                                <Badge variant="outline" className={cn('text-[10px]', catColor.text)}>
                                  {book.category}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center text-xs font-mono" dir="ltr">{book.isbn}</TableCell>
                              <TableCell className="text-center text-sm">{book.totalCopies}</TableCell>
                              <TableCell className="text-center">
                                <span className={cn('text-sm font-medium', book.availableCopies === 0 ? 'text-red-600 dark:text-red-400' : 'text-teal-600 dark:text-teal-400')}>
                                  {book.availableCopies}
                                </span>
                              </TableCell>
                              <TableCell className="text-center">
                                {book.availableCopies === 0 ? (
                                  <Badge className="text-[10px] bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300">نفد</Badge>
                                ) : book.availableCopies <= 3 ? (
                                  <Badge className="text-[10px] bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300">محدود</Badge>
                                ) : (
                                  <Badge className="text-[10px] bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300">متاح</Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Borrowing Records Tab */}
          <TabsContent value="borrowing" className="space-y-4">
            <div className="flex justify-end">
              <Button
                onClick={() => setAddBorrowOpen(true)}
                className="gap-2"
                style={{ background: 'linear-gradient(135deg, #0d9488, #059669)' }}
              >
                <Plus className="h-4 w-4" />
                تسجيل إعارة
              </Button>
            </div>
            <Card className="overflow-hidden dark:bg-gray-900/50 dark:border-gray-700">
              <div className="h-1" style={{ background: 'linear-gradient(90deg, #0d9488, #059669)' }} />
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>اسم الطالب</TableHead>
                        <TableHead>عنوان الكتاب</TableHead>
                        <TableHead className="text-center">تاريخ الإعارة</TableHead>
                        <TableHead className="text-center">تاريخ الاستحقاق</TableHead>
                        <TableHead className="text-center">تاريخ الإرجاع</TableHead>
                        <TableHead className="text-center">الحالة</TableHead>
                        <TableHead className="text-center">إجراء</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {borrowRecords.map((record) => (
                        <TableRow key={record.id} className={cn(
                          'dark:hover:bg-gray-800/50',
                          record.status === 'متأخر' && 'bg-red-50/50 dark:bg-red-950/10'
                        )}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center shrink-0">
                                <User className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                              </div>
                              <span className="font-medium text-sm dark:text-gray-200">{record.studentName}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm dark:text-gray-300">{record.bookTitle}</TableCell>
                          <TableCell className="text-center text-sm" dir="ltr">{record.borrowDate}</TableCell>
                          <TableCell className="text-center text-sm" dir="ltr">{record.dueDate}</TableCell>
                          <TableCell className="text-center text-sm" dir="ltr">{record.returnDate || '—'}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className={cn('text-[10px]', STATUS_COLORS[record.status])}>
                              {record.status === 'متأخر' && <AlertTriangle className="h-3 w-3 ml-1" />}
                              {record.status === 'معار' && <Clock className="h-3 w-3 ml-1" />}
                              {record.status === 'مرجع' && <CheckCircle2 className="h-3 w-3 ml-1" />}
                              {record.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            {record.status !== 'مرجع' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs gap-1 h-7 border-teal-300 text-teal-700 hover:bg-teal-50 dark:border-teal-700 dark:text-teal-400 dark:hover:bg-teal-900/20"
                                onClick={() => handleReturnBook(record.id)}
                              >
                                <CheckCircle2 className="h-3 w-3" />
                                تسجيل إرجاع
                              </Button>
                            )}
                            {record.status === 'مرجع' && (
                              <span className="text-xs text-muted-foreground">تم الإرجاع</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Stats Tab */}
          <TabsContent value="stats" className="space-y-4">
            {/* Category Distribution */}
            <Card className="dark:bg-gray-900/50 dark:border-gray-700">
              <div className="h-1" style={{ background: 'linear-gradient(90deg, #0d9488, #059669)' }} />
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 dark:text-gray-200">
                  <Layers className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                  توزيع الكتب حسب التصنيف
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categoryDist.map((cat) => {
                    const catColor = CATEGORY_COLORS[cat.category] || DEFAULT_CATEGORY
                    const widthPercent = maxCatTotal > 0 ? (cat.total / maxCatTotal) * 100 : 0
                    const availablePercent = cat.total > 0 ? (cat.available / cat.total) * 100 : 0
                    return (
                      <div key={cat.category}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <div className={cn('w-3 h-3 rounded-full', catColor.dot)} />
                            <span className="text-sm font-medium dark:text-gray-200">{cat.category}</span>
                            <span className="text-xs text-muted-foreground">({cat.count} كتاب)</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>الإجمالي: {cat.total}</span>
                            <span>المتاح: {cat.available}</span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 relative overflow-hidden">
                          <motion.div
                            className="h-3 rounded-full absolute right-0"
                            initial={{ width: 0 }}
                            animate={{ width: `${widthPercent}%` }}
                            transition={{ duration: 0.6 }}
                            style={{ background: catColor.bar }}
                          />
                          <motion.div
                            className="h-3 rounded-full absolute right-0 opacity-30"
                            initial={{ width: 0 }}
                            animate={{ width: `${(widthPercent / 100) * availablePercent}%` }}
                            transition={{ duration: 0.8, delay: 0.3 }}
                            style={{ background: '#ffffff' }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Borrowing Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="dark:bg-gray-900/50 dark:border-gray-700 overflow-hidden">
                <div className="h-1" style={{ background: 'linear-gradient(90deg, #d97706, #f59e0b)' }} />
                <CardContent className="p-4 text-center">
                  <ArrowLeftRight className="h-8 w-8 text-amber-600 dark:text-amber-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{borrowedBooks}</p>
                  <p className="text-xs text-muted-foreground">كتاب معار حالياً</p>
                </CardContent>
              </Card>
              <Card className="dark:bg-gray-900/50 dark:border-gray-700 overflow-hidden">
                <div className="h-1" style={{ background: 'linear-gradient(90deg, #059669, #10b981)' }} />
                <CardContent className="p-4 text-center">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{borrowRecords.filter(r => r.status === 'مرجع').length}</p>
                  <p className="text-xs text-muted-foreground">كتاب تم إرجاعه</p>
                </CardContent>
              </Card>
              <Card className="dark:bg-gray-900/50 dark:border-gray-700 overflow-hidden">
                <div className="h-1" style={{ background: 'linear-gradient(90deg, #dc2626, #ef4444)' }} />
                <CardContent className="p-4 text-center">
                  <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-red-700 dark:text-red-300">{overdueCount}</p>
                  <p className="text-xs text-muted-foreground">كتاب متأخر</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Add Book Dialog */}
      <Dialog open={addBookOpen} onOpenChange={setAddBookOpen}>
        <DialogContent className="max-w-lg dark:bg-gray-900 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 dark:text-gray-200">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0d9488, #059669)' }}>
                <BookOpen className="h-4 w-4 text-white" />
              </div>
              إضافة كتاب جديد
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="dark:text-gray-300">عنوان الكتاب *</Label>
              <Input
                value={bookForm.title}
                onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
                placeholder="أدخل عنوان الكتاب"
                className="dark:bg-gray-800 dark:border-gray-600"
              />
            </div>
            <div>
              <Label className="dark:text-gray-300">المؤلف *</Label>
              <Input
                value={bookForm.author}
                onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })}
                placeholder="أدخل اسم المؤلف"
                className="dark:bg-gray-800 dark:border-gray-600"
              />
            </div>
            <div>
              <Label className="dark:text-gray-300">التصنيف</Label>
              <Select value={bookForm.category} onValueChange={(v) => setBookForm({ ...bookForm, category: v })}>
                <SelectTrigger className="dark:bg-gray-800 dark:border-gray-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="أدب">أدب</SelectItem>
                  <SelectItem value="علوم">علوم</SelectItem>
                  <SelectItem value="تاريخ">تاريخ</SelectItem>
                  <SelectItem value="دين">دين</SelectItem>
                  <SelectItem value="لغات">لغات</SelectItem>
                  <SelectItem value="تربية">تربية</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="dark:text-gray-300">ISBN</Label>
              <Input
                value={bookForm.isbn}
                onChange={(e) => setBookForm({ ...bookForm, isbn: e.target.value })}
                placeholder="رقم الكتاب الدولي"
                className="dark:bg-gray-800 dark:border-gray-600"
                dir="ltr"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="dark:text-gray-300">عدد النسخ</Label>
                <Input
                  type="number"
                  min={1}
                  value={bookForm.totalCopies}
                  onChange={(e) => setBookForm({ ...bookForm, totalCopies: parseInt(e.target.value) || 1 })}
                  className="dark:bg-gray-800 dark:border-gray-600"
                />
              </div>
              <div>
                <Label className="dark:text-gray-300">النسخ المتاحة</Label>
                <Input
                  type="number"
                  min={0}
                  value={bookForm.availableCopies}
                  onChange={(e) => setBookForm({ ...bookForm, availableCopies: parseInt(e.target.value) || 0 })}
                  className="dark:bg-gray-800 dark:border-gray-600"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setAddBookOpen(false)}>إلغاء</Button>
            <Button onClick={handleAddBook} style={{ background: 'linear-gradient(135deg, #0d9488, #059669)' }}>
              إضافة الكتاب
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Borrow Dialog */}
      <Dialog open={addBorrowOpen} onOpenChange={setAddBorrowOpen}>
        <DialogContent className="max-w-lg dark:bg-gray-900 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 dark:text-gray-200">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0d9488, #059669)' }}>
                <ArrowLeftRight className="h-4 w-4 text-white" />
              </div>
              تسجيل إعارة جديدة
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="dark:text-gray-300">اسم الطالب *</Label>
              <Input
                value={borrowForm.studentName}
                onChange={(e) => setBorrowForm({ ...borrowForm, studentName: e.target.value })}
                placeholder="أدخل اسم الطالب"
                className="dark:bg-gray-800 dark:border-gray-600"
              />
            </div>
            <div>
              <Label className="dark:text-gray-300">الكتاب *</Label>
              <Select value={borrowForm.bookId} onValueChange={(v) => setBorrowForm({ ...borrowForm, bookId: v })}>
                <SelectTrigger className="dark:bg-gray-800 dark:border-gray-600">
                  <SelectValue placeholder="اختر الكتاب" />
                </SelectTrigger>
                <SelectContent>
                  {books.filter(b => b.availableCopies > 0).map(b => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.title} ({b.availableCopies} نسخة متاحة)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="dark:text-gray-300">تاريخ الإعارة</Label>
                <Input
                  type="date"
                  value={borrowForm.borrowDate}
                  onChange={(e) => setBorrowForm({ ...borrowForm, borrowDate: e.target.value })}
                  className="dark:bg-gray-800 dark:border-gray-600"
                />
              </div>
              <div>
                <Label className="dark:text-gray-300">تاريخ الاستحقاق *</Label>
                <Input
                  type="date"
                  value={borrowForm.dueDate}
                  onChange={(e) => setBorrowForm({ ...borrowForm, dueDate: e.target.value })}
                  className="dark:bg-gray-800 dark:border-gray-600"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setAddBorrowOpen(false)}>إلغاء</Button>
            <Button onClick={handleAddBorrow} style={{ background: 'linear-gradient(135deg, #0d9488, #059669)' }}>
              تسجيل الإعارة
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
