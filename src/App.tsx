import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Search, Globe, LockKeyhole, LogOut, Plus, Pencil, Trash2, ImagePlus, X, Leaf, Instagram } from 'lucide-react'
import { isSupabaseConfigured, supabase } from './lib/supabase'

type Category = { id: string; name_ar: string; name_en: string; display_order: number; is_active: boolean }
type Product = { id: string; category_id: string; name_ar: string; name_en: string; description_ar: string | null; description_en: string | null; price: number; image_url: string | null; is_available: boolean; display_order: number }
const fallbackCats: Category[] = []
const money = (n: number, en: boolean) => new Intl.NumberFormat(en ? 'en-EG' : 'ar-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(n)

export default function App() {
  const [lang, setLang] = useState<'ar'|'en'>('ar')
  const [cats, setCats] = useState<Category[]>(fallbackCats)
  const [products, setProducts] = useState<Product[]>([])
  const [active, setActive] = useState('all')
  const [search, setSearch] = useState('')
  const [adminOpen, setAdminOpen] = useState(false)
  const [session, setSession] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [editing, setEditing] = useState<Product|null>(null)
  const [showForm, setShowForm] = useState(false)
  const [nameAr, setNameAr] = useState('')
  const [nameEn, setNameEn] = useState('')
  const [price, setPrice] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [descriptionAr, setDescriptionAr] = useState('')
  const [descriptionEn, setDescriptionEn] = useState('')
  const [image, setImage] = useState<File|null>(null)
  const en = lang === 'en'
  const t = (ar: string, english: string) => en ? english : ar

  async function loadMenu() {
    if (!supabase) return
    const [{ data: c }, { data: p }] = await Promise.all([
      supabase.from('categories').select('*').order('display_order'),
      supabase.from('products').select('*').order('display_order')
    ])
    if (c) setCats(c as Category[])
    if (p) setProducts(p as Product[])
  }
  async function checkAdmin(s: any) {
    if (!supabase || !s?.user) { setIsAdmin(false); return }
    const { data } = await supabase.from('admin_users').select('user_id').eq('user_id', s.user.id).maybeSingle()
    setIsAdmin(Boolean(data))
  }
  useEffect(() => {
    loadMenu()
    if (!supabase) return
    supabase.auth.getSession().then(async ({ data }) => { setSession(data.session); await checkAdmin(data.session) })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      setTimeout(() => { checkAdmin(s) }, 0)
    })
    return () => listener.subscription.unsubscribe()
  }, [])
  const visible = useMemo(() => products.filter(p => p.is_available && (active === 'all' || p.category_id === active) && (p.name_ar.toLowerCase().includes(search.toLowerCase()) || p.name_en.toLowerCase().includes(search.toLowerCase()))), [products, active, search])
  async function login(e: FormEvent) {
    e.preventDefault(); setError(''); setBusy(true)
    if (!supabase) { setError(t('إعدادات الاتصال بقاعدة البيانات ناقصة.','Supabase environment variables are missing.')); setBusy(false); return }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setBusy(false)
  }
  function newProduct() {
    setEditing(null); setNameAr(''); setNameEn(''); setPrice(''); setDescriptionAr(''); setDescriptionEn(''); setImage(null); setCategoryId(cats[0]?.id || ''); setShowForm(true)
  }
  function editProduct(p: Product) {
    setEditing(p); setNameAr(p.name_ar); setNameEn(p.name_en); setPrice(String(p.price)); setDescriptionAr(p.description_ar || ''); setDescriptionEn(p.description_en || ''); setCategoryId(p.category_id); setImage(null); setShowForm(true)
  }
  async function saveProduct(e: FormEvent) {
    e.preventDefault(); if (!supabase || !isAdmin) return
    setBusy(true); setError('')
    let imageUrl = editing?.image_url || null
    if (image) {
      const path = Date.now() + '-' + image.name.replace(/[^a-zA-Z0-9._-]/g, '-')
      const { error: uploadError } = await supabase.storage.from('menu-images').upload(path, image, { upsert: false })
      if (uploadError) { setError(uploadError.message); setBusy(false); return }
      imageUrl = supabase.storage.from('menu-images').getPublicUrl(path).data.publicUrl
    }
    const payload = { name_ar: nameAr, name_en: nameEn, price: Number(price), category_id: categoryId, description_ar: descriptionAr || null, description_en: descriptionEn || null, image_url: imageUrl }
    const result = editing ? await supabase.from('products').update(payload).eq('id', editing.id) : await supabase.from('products').insert(payload)
    if (result.error) setError(result.error.message)
    else { setShowForm(false); await loadMenu() }
    setBusy(false)
  }
  async function deleteProduct(id: string) {
    if (!supabase || !isAdmin || !confirm(t('متأكد إنك عايز تحذف المنتج؟','Delete this product?'))) return
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) setError(error.message); else await loadMenu()
  }
  async function saveCategory() {
    if (!supabase || !isAdmin) return
    const ar = prompt(t('اسم القسم بالعربي','Category name in Arabic')); if (!ar?.trim()) return
    const english = prompt(t('اسم القسم بالإنجليزي','Category name in English')); if (!english?.trim()) return
    const { error } = await supabase.from('categories').insert({ name_ar: ar.trim(), name_en: english.trim(), display_order: cats.length })
    if (error) setError(error.message); else await loadMenu()
  }
  async function toggleAvailability(p: Product) {
    if (!supabase || !isAdmin) return
    const { error } = await supabase.from('products').update({ is_available: !p.is_available }).eq('id', p.id)
    if (error) setError(error.message); else await loadMenu()
  }
  return <div dir={en ? 'ltr' : 'rtl'} className={en ? 'app english' : 'app'}>
    <header className="topbar"><a className="brand" href="#"><span className="brand-mark"><Leaf size={21}/></span><span>KIWI<small>FRESH TASTE</small></span></a><nav><button className="ghost" onClick={() => setLang(en?'ar':'en')}><Globe size={17}/>{en?'العربية':'English'}</button><button className="ghost" onClick={() => setAdminOpen(true)}><LockKeyhole size={16}/>{t('الإدارة','Admin')}</button></nav></header>
    <section className="hero"><div className="hero-copy"><span className="eyebrow">{t('طازة • لذيذة • على مزاجك','FRESH • DELICIOUS • YOUR WAY')}</span><h1>{t('اختار مزاجك،','Pick your')}<br/><em>{t('وإحنا نجهزهولك.','perfect treat.')}</em></h1><p>{t('اكتشف منيو كيوي واختار من تشكيلتنا المميزة.','Explore Kiwi’s menu and find your new favourite.')}</p></div><div className="hero-orb"><span>KIWI</span><Leaf size={74}/></div></section>
    {!isSupabaseConfigured && <div className="notice">{t('المنيو في وضع التجهيز. أضف إعدادات Supabase لتوصيل البيانات.','Menu preview mode. Add Supabase settings to load live data.')}</div>}
    <main className="menu-wrap"><div className="section-head"><div><span className="eyebrow">{t('منيو كيوي','THE KIWI MENU')}</span><h2>{t('إيه نفسك فيه؟','What are you craving?')}</h2></div><label className="search"><Search size={18}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder={t('دور على حاجة بتحبها...','Search the menu...')}/></label></div>
      <div className="chips"><button className={active==='all'?'chip selected':'chip'} onClick={()=>setActive('all')}>{t('الكل','All')}</button>{cats.filter(c=>c.is_active).map(c=><button key={c.id} className={active===c.id?'chip selected':'chip'} onClick={()=>setActive(c.id)}>{en?c.name_en:c.name_ar}</button>)}</div>
      {visible.length===0 ? <div className="empty"><span>🥝</span><h3>{t('لسه بنجهزلك أحلى اختيارات','Fresh picks coming soon')}</h3><p>{t('المنتجات هتظهر هنا بمجرد إضافتها من لوحة الإدارة.','Products will appear here once added from the admin dashboard.')}</p></div> : <div className="products">{visible.map(p=><article className="product" key={p.id}>{p.image_url ? <img className="product-image" src={p.image_url} alt={en?p.name_en:p.name_ar}/> : <div className="product-placeholder"><Leaf size={32}/></div>}<div className="product-info"><div><h3>{en?p.name_en:p.name_ar}</h3><p>{en?p.description_en:p.description_ar}</p></div><strong>{money(p.price,en)}</strong>{isAdmin && <div className="admin-actions"><button onClick={()=>editProduct(p)}><Pencil size={15}/>{t('تعديل','Edit')}</button><button onClick={()=>toggleAvailability(p)}>{p.is_available?t('إخفاء','Hide'):t('إظهار','Show')}</button><button onClick={()=>deleteProduct(p.id)}><Trash2 size={15}/></button></div>}</div></article>)}</div>}
    </main>
    <footer><div className="footer-brand">KIWI <span>🥝</span></div><p>{t('طعم يفرّح يومك.','A little taste of happiness.')}</p><div className="socials"><a href="https://www.linkedin.com/in/mina-ayman-gerges-kamel" target="_blank" rel="noreferrer">LinkedIn</a><a href="https://wa.me/mina.ayman.g" target="_blank" rel="noreferrer">WhatsApp</a></div><small>© {new Date().getFullYear()} Kiwi. All rights reserved.</small></footer>
    {adminOpen && <div className="modal-backdrop" onClick={()=>setAdminOpen(false)}><section className="modal" onClick={e=>e.stopPropagation()}><button className="close" onClick={()=>setAdminOpen(false)}><X/></button>{isAdmin ? <><h2>{t('لوحة التحكم','Admin dashboard')}</h2><p>{t('أنت مسجل دخول كمسؤول.','You are signed in as an admin.')}</p><div className="dashboard-actions"><button className="primary" onClick={newProduct}><Plus size={17}/>{t('إضافة منتج','Add product')}</button><button className="secondary" onClick={saveCategory}><Plus size={17}/>{t('إضافة قسم','Add category')}</button><button className="secondary" onClick={async()=>{await supabase?.auth.signOut();setAdminOpen(false)}}><LogOut size={17}/>{t('تسجيل الخروج','Sign out')}</button></div><p className="muted">{t('يمكنك تعديل المنتجات من أزرار التعديل الظاهرة على بطاقاتها.','Use the edit controls shown on product cards to manage them.')}</p></> : <><h2>{t('دخول المسؤول','Admin sign in')}</h2><p>{t('سجل دخولك لإدارة منيو كيوي.','Sign in to manage the Kiwi menu.')}</p><form onSubmit={login} className="login-form"><input type="email" required placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)}/><input type="password" required placeholder={t('كلمة المرور','Password')} value={password} onChange={e=>setPassword(e.target.value)}/><button className="primary" disabled={busy}>{busy?t('جاري الدخول...','Signing in...'):t('تسجيل الدخول','Sign in')}</button></form>{error&&<p className="error">{error}</p>}</>}</section></div>}
    {showForm && <div className="modal-backdrop" onClick={()=>setShowForm(false)}><section className="modal wide" onClick={e=>e.stopPropagation()}><button className="close" onClick={()=>setShowForm(false)}><X/></button><h2>{editing?t('تعديل المنتج','Edit product'):t('إضافة منتج','Add product')}</h2><form className="product-form" onSubmit={saveProduct}><label>{t('الاسم بالعربي','Arabic name')}<input required value={nameAr} onChange={e=>setNameAr(e.target.value)}/></label><label>{t('الاسم بالإنجليزي','English name')}<input required value={nameEn} onChange={e=>setNameEn(e.target.value)}/></label><label>{t('السعر بالجنيه','Price in EGP')}<input required min="0" type="number" value={price} onChange={e=>setPrice(e.target.value)}/></label><label>{t('القسم','Category')}<select required value={categoryId} onChange={e=>setCategoryId(e.target.value)}>{cats.filter(c=>c.is_active).map(c=><option key={c.id} value={c.id}>{c.name_ar} / {c.name_en}</option>)}</select></label><label>{t('وصف عربي (اختياري)','Arabic description (optional)')}<textarea value={descriptionAr} onChange={e=>setDescriptionAr(e.target.value)}/></label><label>{t('وصف إنجليزي (اختياري)','English description (optional)')}<textarea value={descriptionEn} onChange={e=>setDescriptionEn(e.target.value)}/></label><label className="file-label"><ImagePlus size={18}/>{t('صورة المنتج (اختياري)','Product image (optional)')}<input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>setImage(e.target.files?.[0]||null)}/></label><button className="primary" disabled={busy||!categoryId}>{busy?t('جاري الحفظ...','Saving...'):t('حفظ المنتج','Save product')}</button>{error&&<p className="error">{error}</p>}</form></section></div>}
  </div>
}