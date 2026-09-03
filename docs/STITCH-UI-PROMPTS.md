# Stitch AI — Arayüz Ekranları Prompt Rehberi

Bu doküman, Article Intelligence Platform'un tüm arayüz ekranlarını [Google Stitch](https://stitch.withgoogle.com) üzerinde üretmek için hazırlanmış, kopyala-yapıştır kullanılabilir prompt setidir. `masterplan.md` → **"33. FRONTEND PAGES"** ve ilgili bölümlerden (34–38) türetilmiştir.

> Bu dosya bir tasarım/prompt referansıdır, `memory-bank/` protokolünün parçası değildir. Kod tabanını etkilemez.

---

## 1. Nasıl Kullanılır

1. [stitch.withgoogle.com](https://stitch.withgoogle.com) adresinde yeni bir proje aç, adını **"Makale Platformu — Web"** koy ve platformu **Web (masaüstü öncelikli, responsive)** olarak seç.
2. İlk üretim olarak aşağıdaki **Bölüm 2 — Tasarım Sistemi Prompt'u**nu gönder. Stitch bunu tek bir ekran gibi render edecek ama amacı; renk paleti, tipografi ve bileşen dilini projenin "hafızasına" yazmaktır.
3. Sonraki her ekran için Stitch'te **"Add screen" / "New screen"** ile aynı projede yeni bir ekran aç ve **Bölüm 4**'teki ilgili prompt'u birebir yapıştır. Aynı proje içinde kalman, Stitch'in önceki ekranlardaki stil dilini referans almasını sağlar.
4. Her ekranı ürettikten sonra Stitch'in "variations" özelliğiyle 2-3 alternatif üret, en tutarlı olanı seç.
5. Beğendiğin ekranları Figma'ya aktar veya kod (HTML/CSS) olarak indir; gerçek implementasyon sırasında Tailwind CSS class'larına manuel çevireceğiz (Stitch çıktısı bire bir kod olarak kullanılmayacak, referans/mockup olarak kullanılacak).
6. Prompt'lar kasıtlı olarak Türkçe ve platforma özgü örnek içerikle (gerçekçi makale başlıkları, kategori adları vb.) yazıldı — Stitch'e daha isabetli sonuç üretmesi için somut örnek veri vermek önemlidir.

---

## 2. Tasarım Sistemi Prompt'u (ilk gönderilecek)

```
Akademik/editoryal makale değerlendirme ve yayınlama platformu için web tabanlı
(masaüstü öncelikli, tam responsive) bir tasarım sistemi oluştur.

MARKA KİŞİLİĞİ:
Güvenilir, şeffaf, veri odaklı ama sade. Akademik yayıncılık (arXiv, SSRN) ile
modern SaaS dashboard (Linear, Notion) hissinin karışımı. Sansasyonel değil,
temkinli ve bilgilendirici bir ton.

RENK PALETİ:
- Ana renk (primary): Koyu lacivert / çivit mavi (#1E3A5F civarı) — güven ve otorite
- Vurgu rengi (accent): Zümrüt yeşili (#10B981 civarı) — yüksek kalite/skor
- İkincil vurgu: Amber/turuncu (#F59E0B civarı) — orta seviye uyarı
- Tehlike rengi: Kiremit kırmızı (#DC2626 civarı) — sadece kritik durumlar,
  asla alarm verici/sansasyonel biçimde kullanılmaz
- Nötr skala: Slate gri tonları, açık arka plan (#F8FAFC), koyu metin (#0F172A)
- Varsayılan açık tema

TİPOGRAFİ:
- Makale başlıkları ve editoryal içerik: Serif font (Source Serif Pro / Lora
  tarzı) — okuma deneyimi ve akademik hava
- Arayüz elemanları, gövde metni, formlar: Sans-serif (Inter tarzı) — modern
  ve okunaklı

ÖZEL BİLEŞEN DİLİ (çok önemli, her ekranda tutarlı uygula):
- Skor göstergesi: 0-100 arası dairesel gösterge (circular gauge) veya renk
  kodlu rozet. 0-40 kırmızı/turuncu, 40-70 sarı/amber, 70-100 yeşil gradyanı.
- AI yazarlık riski göstergesi: ASLA ikili "AI yazdı / İnsan yazdı" rozeti
  kullanma. Bunun yerine 5 kademeli NÖTR etiket kullan: "Çok Düşük",
  "Düşük", "Belirsiz", "Yüksek", "Çok Yüksek" — küçük renkli nokta + metin
  etiketi, sakin tonlarda (kırmızı bile çok koyu/agresif olmasın).
- Makale durum rozetleri (küçük, yuvarlak köşeli, nötr renkli): Taslak,
  Gönderildi, Analiz Kuyruğunda, Analiz Ediliyor, Analiz Tamamlandı,
  Yayına Hazır, İncelemede, Reddedildi, Yayında, Arşivlendi, Başarısız.
- Kartlar: Yumuşak köşeler (rounded-xl), hafif gölge, beyaz/açık gri zemin,
  hover'da hafif yükselme efekti.
- Butonlar: Birincil (koyu lacivert dolgu, beyaz metin), ikincil (outline,
  lacivert kenarlık), tehlike (kırmızı, sadece silme/reddetme gibi kritik
  aksiyonlarda, az kullanım).
- Navigasyon: Üstte sabit header — sol logo, orta/sağ arama kutusu, sağ
  köşede kullanıcı avatarı + dropdown menü.
- Genel boşluk kullanımı: Bol beyaz alan, yoğun olmayan bilgi mimarisi,
  her ekranda maksimum 2 birincil aksiyon butonu.

Bu tasarım sistemini bundan sonra üreteceğim tüm ekranlarda birebir ve
tutarlı şekilde uygula.
```

---

## 3. Ekran Haritası (özet)

| # | Ekran | Route | Rol |
| --- | --- | --- | --- |
| 1 | Anasayfa | `/` | Herkes |
| 2 | Makale Listeleme | `/articles` | Herkes |
| 3 | Makale Detay | `/articles/[slug]` | Herkes |
| 4 | Kategori Sayfası | `/categories/[slug]` | Herkes |
| 5 | Gelişmiş Arama | `/search` | Herkes |
| 6 | Herkese Açık Profil | `/profile/[username]` | Herkes |
| 7 | Giriş | `/login` | Misafir |
| 8 | Kayıt | `/register` | Misafir |
| 9 | Şifremi Unuttum / Sıfırla | `/forgot-password`, `/reset-password` | Misafir (ek) |
| 10 | Kullanıcı Paneli | `/dashboard` | Kullanıcı |
| 11 | Makalelerim | `/dashboard/articles` | Kullanıcı |
| 12 | Makale Gönder | `/dashboard/articles/new` | Kullanıcı |
| 13 | Taslak Düzenle | `/dashboard/articles/[id]/edit` | Kullanıcı |
| 14 | Analiz Sonucu | `/dashboard/articles/[id]/analysis` | Kullanıcı |
| 15 | Profil Ayarları | `/settings/profile` | Kullanıcı |
| 16 | Admin Dashboard | `/admin` | Admin |
| 17 | Moderasyon | `/admin/articles` | Moderatör/Admin |
| 18 | Analiz İzleme | `/admin/analysis` | Admin |
| 19 | Kategori Yönetimi | `/admin/categories` | Admin |
| 20 | Kullanıcı Yönetimi | `/admin/users` | Admin |
| 21 | 404 / Boş Durumlar | — | Herkes (ek) |

---

## 4. Ekran Prompt'ları

### 4.1 Herkese Açık Sayfalar

#### 1. Anasayfa (`/`)

**Amaç:** Keşif odaklı giriş sayfası. Kullanıcı ilk izlenimde platformun "skor + şeffaflık" değerini anlamalı.

```
Bir akademik makale değerlendirme platformunun ANASAYFASINI tasarla. Sayfa
keşfe odaklı olsun, aşırı yoğun olmasın.

BÖLÜMLER (yukarıdan aşağıya):
1. Üst navigasyon: sol logo, orta arama kutusu ("Makale, yazar veya konu
   ara..."), sağda "Giriş Yap" / "Kayıt Ol" butonları (kullanıcı giriş
   yapmamış hali).
2. Hero bölümü: büyük başlık ("Yapay zekâ destekli, şeffaf makale
   değerlendirmesi"), alt metin, birincil CTA butonu "Makaleni Gönder",
   arka planda soyut/geometrik bir illüstrasyon.
3. "En Yüksek Skorlu Makaleler" bölümü: yatay kaydırmalı 4 makale kartı.
4. "Yeni Yayınlananlar" bölümü: 3 sütunlu grid, 6 makale kartı.
5. "Trend Konular" bölümü: yuvarlak köşeli etiket/chip bulutu (örnek:
   Yapay Zeka Etiği, İklim Bilimi, Kuantum Hesaplama, Nörobilim, Ekonomi
   Politikaları).
6. "Kategoriler" bölümü: ikonlu 6 kategori kartı (Bilgisayar Bilimi, Tıp,
   Sosyal Bilimler, Mühendislik, Ekonomi, Çevre Bilimleri) — her biri
   makale sayısını gösteriyor.
7. "Senin İçin Önerilenler" bölümü: 3 makale kartı (giriş yapmış kullanıcı
   varsayımıyla kişiselleştirilmiş etiket).
8. Alt bilgi (footer): sütunlu link grupları + telif hakkı satırı.

MAKALE KARTI İÇERİĞİ (her kartta):
- Başlık (örnek: "Büyük Dil Modellerinde Halüsinasyon Tespiti için Yeni
  Bir Çerçeve")
- Yazar adı + küçük profil fotoğrafı
- Kategori etiketi
- 2 satırlık özet
- Yayın tarihi + tahmini okuma süresi (örn. "8 dk")
- Sağ üstte final skor rozeti (dairesel gösterge, örn. 87/100, yeşil)
- Küçük "AI yazarlık riski: Düşük" etiketi (nötr renk, alarmist değil)
- Alt kısımda 2-3 küçük konu etiketi (tag)

Genel his: temiz, ferah, güven veren, akademik ama modern.
```

#### 2. Makale Listeleme (`/articles`)

```
Bir akademik makale platformunun MAKALE LİSTELEME sayfasını tasarla.

LAYOUT: Sol tarafta sabit filtre paneli (yaklaşık %22 genişlik), sağda
makale listesi (%78 genişlik).

SOL FİLTRE PANELİ:
- "Filtreler" başlığı + "Temizle" linki
- Kategori (checkbox listesi: Bilgisayar Bilimi, Tıp, Sosyal Bilimler,
  Mühendislik, Ekonomi, Çevre Bilimleri)
- Etiket (arama kutulu multi-select chip listesi)
- Minimum Skor (slider, 0-100)
- Maksimum AI Yazarlık Riski (slider, "Çok Düşük" - "Çok Yüksek")
- Yayın Tarihi (tarih aralığı seçici)
- Makale Türü (radio: Araştırma, Derleme, Vaka Analizi, Görüş)

ÜST BAR (liste alanının üstünde):
- Sonuç sayısı ("1.284 makale bulundu")
- Sıralama dropdown: "En Yüksek Skorlu", "En Yeni", "En Çok Görüntülenen",
  "En İlgili"
- Uygulanan filtreler chip olarak gösterilsin (her chip'in yanında X ile
  kaldırma ikonu)

MAKALE LİSTESİ: dikey liste halinde, her satır geniş bir makale kartı
(başlık, yazar+avatar, kategori, özet, tarih, final skor dairesel gösterge,
AI risk etiketi, okuma süresi, etiketler). Kartlar arası ince ayırıcı çizgi.

ALT KISIM: sayfalama (pagination) — numaralı sayfalar + "İleri/Geri".

Ayrıca aynı ekranın "sonuç bulunamadı" boş durumunu da küçük bir varyant
olarak göster: ortada büyük bir arama ikonu, "Kriterlerinize uygun makale
bulunamadı" mesajı, "Filtreleri Temizle" butonu.
```

#### 3. Makale Detay (`/articles/[slug]`)

**Amaç:** Şeffaflık bu platformun temel ürün özelliği — skor detayına inilebilmeli.

```
Bir akademik makale platformunun MAKALE DETAY sayfasını tasarla. Sayfa
iki sütunlu: sol/ana sütun (%68) makale içeriği, sağ sütun (%32) skor ve
analiz bilgisi (sticky/yapışkan sidebar).

ÜST KISIM (ana sütun, tam genişlik):
- Kategori etiketi + makale türü rozeti
- Büyük serif başlık: "Büyük Dil Modellerinde Halüsinasyon Tespiti için
  Yeni Bir Çerçeve"
- Yazar satırı: avatar + isim (link gibi görünsün) + yayın tarihi +
  okuma süresi
- Etiketler (tag) satırı
- Aksiyon ikonları: yer imi (bookmark), paylaş, yazdır

ANA SÜTUN (makale gövdesi):
- Serif fontla uzun form akademik metin, alt başlıklar (H2/H3), 1-2
  paragraf placeholder metin, bir örnek tablo ve bir örnek alıntı bloğu
- En altta "İlgili Makaleler" bölümü: 3 makale kartı grid

SAĞ SIDEBAR (yapışkan, kartlar halinde):
1. "Değerlendirme Skoru" kartı: büyük dairesel gösterge (87/100, yeşil),
   altında "Bu skor nasıl hesaplandı?" başlıklı AÇILIR/COLLAPSIBLE bölüm
   (kapalı halde bir ok ikonuyla gösterilsin). Açıldığında 6 alt metrik
   çubuk grafik olarak görünsün: Yapı Uyumu %20, İçerik Kalitesi %20,
   Konu İlgisi %15, Kanıt ve Atıf Kalitesi %20, Bilgi Doğruluğu %15,
   Özgünlük %10 — her biri kendi yüzde skoru ve ağırlığıyla.
2. "AI Yazarlık Değerlendirmesi" kartı: nötr 5 kademeli risk etiketi
   ("Düşük"), yanında "Güven Skoru: %72" küçük gösterge, altında kısa
   açıklama metni (örn. "Bu değerlendirme, dil örüntüleri ve yapısal
   sinyallere dayanır; kesin bir yargı değildir.")
3. "Kaynak Doğrulama" kartı: liste halinde 3-4 kaynak/atıf, her biri
   yanında yeşil tik veya sarı uyarı ikonuyla "doğrulandı / kontrol
   edilemedi" durumu
4. "Yazar Hakkında" mini kartı: avatar, isim, kısa bio, "Profili Gör"
   linki

Genel his: okunabilir, güven veren, şeffaflığı ön plana çıkaran.
```

#### 4. Kategori Sayfası (`/categories/[slug]`)

```
Bir akademik makale platformunun KATEGORİ sayfasını tasarla (örnek kategori:
"Bilgisayar Bilimi").

ÜST BÖLÜM (kategori başlığı): büyük ikon + kategori adı, kısa açıklama
metni (1-2 cümle), istatistik satırı ("342 makale · Ortalama skor: 81").

ALT BÖLÜM: Makale Listeleme sayfasıyla aynı düzende (üstte sıralama
dropdown + sonuç sayısı, altta dikey makale kartı listesi + sayfalama),
ancak sol filtre paneli daha sade — kategori zaten sabit olduğundan
sadece etiket, skor, tarih ve sıralama filtreleri gösterilsin.

Ayrıca üst bölümün altında ilgili alt-kategoriler veya popüler etiketler
için küçük bir chip satırı ekle (örn. "Makine Öğrenmesi", "Dağıtık
Sistemler", "İnsan-Bilgisayar Etkileşimi").
```

#### 5. Gelişmiş Arama (`/search`)

```
Bir akademik makale platformunun GELİŞMİŞ ARAMA sayfasını tasarla.

ÜST KISIM: büyük ortalanmış arama kutusu, altında "Gelişmiş filtreler"
diye açılıp kapanan bir panel.

GELİŞMİŞ FİLTRE PANELİ (yatay, kart içinde, formda gruplanmış):
- Kategori (multi-select dropdown)
- Etiket (arama kutulu chip seçici)
- Yazar (arama kutulu otomatik tamamlama alanı)
- Minimum Skor (slider 0-100)
- Maksimum AI Yazarlık Riski (5 kademeli seçici)
- Yayın Tarihi Aralığı (başlangıç/bitiş tarih seçici)
- Makale Türü (checkbox grubu)
- Sıralama: "En Yüksek Skorlu", "En Yeni", "En Çok Görüntülenen",
  "En İlgili"
- "Ara" birincil butonu + "Filtreleri Temizle" ikincil buton

UYGULANAN FİLTRELER: arama kutusunun altında chip olarak gösterilsin,
her chipte kaldırma (X) ikonu — bu filtrelerin URL parametrelerine
yansıdığını ima eden küçük bir not/ikon olabilir.

SONUÇ ALANI: Makale Listeleme sayfasındaki gibi dikey kart listesi +
sonuç sayısı + sayfalama. Sonuç yokken boş durum: "Arama kriterlerinize
uygun sonuç bulunamadı, filtreleri gevşetmeyi deneyin" mesajı.
```

#### 6. Herkese Açık Profil (`/profile/[username]`)

```
Bir akademik makale platformunda bir YAZARIN HERKESE AÇIK PROFİL sayfasını
tasarla.

ÜST BANNER/HEADER: büyük yuvarlak avatar, yazar adı, ünvan/bio kısa metni
(örn. "Bilgisayar Bilimleri Doktora Öğrencisi · İstanbul Teknik
Üniversitesi"), katılım tarihi ("Ocak 2024'ten beri üye").

İSTATİSTİK ŞERİDİ (4 küçük kart yan yana):
- Toplam Yayınlanan Makale
- Ortalama Değerlendirme Skoru (dairesel mini gösterge)
- Toplam Görüntülenme
- Takipçi Sayısı (varsa)

SEKME (TAB) BARI: "Yayınlanan Makaleler" (aktif), "Hakkında"

"Yayınlanan Makaleler" sekmesi: 2-3 sütunlu grid halinde makale kartları
(standart kart formatı: başlık, kategori, tarih, skor rozeti, AI risk
etiketi).

"Hakkında" sekmesi: uzun bio metni, ilgi alanları etiket bulutu, dış
bağlantılar (ORCID, kişisel web sitesi gibi ikonlu linkler).
```

---

### 4.2 Kimlik Doğrulama

#### 7. Giriş (`/login`)

```
Bir akademik makale platformu için sade ve güven veren bir GİRİŞ (login)
sayfası tasarla.

LAYOUT: Ekranın ortasında dikey bir kart (max genişlik ~420px), arka plan
hafif degrade renkli veya soyut bir illüstrasyonla desteklenmiş sol/yarım
panel (isteğe bağlı split-screen düzeni de olabilir: sol taraf marka
mesajı + illüstrasyon, sağ taraf form).

KART İÇERİĞİ:
- Üstte logo
- Başlık: "Hesabına Giriş Yap"
- E-posta alanı
- Şifre alanı (göz ikonu ile göster/gizle)
- "Beni Hatırla" checkbox + "Şifremi Unuttum" linki (sağa hizalı)
- Birincil "Giriş Yap" butonu (tam genişlik)
- Ayırıcı çizgi ("veya")
- (Devre dışı/soluk görünümlü) sosyal giriş butonları — Google, ORCID
- Alt kısımda "Hesabın yok mu? Kayıt Ol" linki

Form hata durumu varyantı da göster: e-posta alanının altında kırmızı
küçük hata metni "Geçersiz e-posta veya şifre".
```

#### 8. Kayıt (`/register`)

```
Bir akademik makale platformu için KAYIT (register) sayfası tasarla, giriş
sayfasıyla aynı görsel dilde (split-screen veya ortalanmış kart).

FORM ALANLARI:
- Ad Soyad
- Kullanıcı Adı (yanında küçük "makaleapp.com/@kullaniciadi" önizlemesi)
- E-posta
- Şifre (güç göstergeli — zayıf/orta/güçlü renkli çubuk)
- Şifre Tekrar
- Kullanım Şartları ve Gizlilik Politikası checkbox'ı (linkli metin)
- Birincil "Kayıt Ol" butonu (tam genişlik)
- Alt kısımda "Zaten hesabın var mı? Giriş Yap" linki

Kayıt sonrası "E-postanı Doğrula" ara ekranını da aynı stilde bir varyant
olarak göster: büyük zarf ikonu, "quantum@example.com adresine bir
doğrulama bağlantısı gönderdik" mesajı, "E-postayı Yeniden Gönder" ikincil
butonu.
```

#### 9. Şifremi Unuttum / Sıfırla — *(ek/opsiyonel ekran)*

```
Aynı görsel dilde İKİ AŞAMALI bir şifre sıfırlama akışı tasarla:

EKRAN A — Şifremi Unuttum: ortalanmış kart, başlık "Şifreni mi
unuttun?", açıklama metni, e-posta alanı, "Sıfırlama Bağlantısı Gönder"
butonu, altta "Giriş sayfasına dön" linki.

EKRAN B — Yeni Şifre Belirle: aynı kart formatında, başlık "Yeni Şifre
Belirle", yeni şifre + şifre tekrar alanları (güç göstergeli), "Şifreyi
Güncelle" butonu.

İki ekranı da yan yana veya ayrı ayrı göster.
```

---

### 4.3 Kullanıcı Paneli (Dashboard)

#### 10. Kullanıcı Paneli — Ana Sayfa (`/dashboard`)

```
Giriş yapmış bir kullanıcı için AUTHOR DASHBOARD (kullanıcı paneli ana
sayfası) tasarla.

LAYOUT: Sol tarafta sabit dikey navigasyon menüsü (Panel, Makalelerim,
Yeni Makale, Profil Ayarları, Çıkış Yap — ikonlu), sağda ana içerik alanı.

ÜST KISIM: karşılama mesajı ("Merhaba, Ayşe 👋") + "Yeni Makale Gönder"
birincil butonu (sağ üstte).

DURUM KARTLARI (yatay grid, 8 kart, her biri sayı + etiket + ince renkli
üst çizgi): Taslak (3), Gönderildi (1), Analiz Kuyruğunda (1), Analiz
Ediliyor (1), İncelemede (0), Yayına Hazır (2), Yayında (12), Reddedildi
(1), Başarısız (0). Her kart tıklanabilir görünsün (hover efekti).

ORTA BÖLÜM: "Son Aktivite" başlıklı zaman çizelgesi (timeline) listesi —
her satırda küçük ikon + aksiyon metni + zaman damgası (örn. "'Kuantum
Hesaplamada Hata Düzeltme' makalen analiz edildi — 2 saat önce").

SAĞ/ALT BÖLÜM: küçük bir çizgi grafik kartı "Ortalama Skor Trendi (son 6
ay)" ve bir "En İyi Skorlu Makalen" mini kartı.

Boş durum varyantı da ekle: hiç makale göndermemiş yeni kullanıcı için
ortada büyük illüstrasyon + "Henüz bir makale göndermedin" mesajı +
"İlk Makaleni Gönder" birincil butonu.
```

#### 11. Makalelerim (`/dashboard/articles`)

```
Kullanıcı panelinin MAKALELERİM sayfasını tasarla (sol navigasyon aynı
şekilde sabit kalsın).

ÜST BAR: başlık "Makalelerim", sağda "Yeni Makale Gönder" birincil
butonu, altında durum filtre tab'ları (Tümü, Taslak, Gönderildi, Analiz
Ediliyor, İncelemede, Yayına Hazır, Yayında, Reddedildi, Başarısız) ve
bir arama kutusu.

TABLO/LİSTE GÖRÜNÜMÜ (satır satır):
- Makale başlığı (link gibi)
- Durum rozeti (renkli, küçük)
- Final skor (varsa dairesel mini gösterge, yoksa "—")
- Son güncelleme tarihi
- Aksiyon butonları/menü (üç nokta): Düzenle, Analizi Görüntüle, Gönder,
  Arşivle, Sil

Analiz devam eden bir satırda durum rozetinin yanında küçük bir ilerleme
göstergesi (spinner veya ince progress bar) olsun.

Boş durum: filtreye uygun makale yoksa ortada mesaj + "Filtreyi Temizle"
linki.
```

#### 12. Makale Gönder (`/dashboard/articles/new`)

```
Kullanıcı panelinde YENİ MAKALE GÖNDERME formunu tasarla. Form tek sayfa
ama net bölümlere ayrılmış (adım göstergesi/stepper olmadan, dikey akan
form bölümleri şeklinde).

FORM BÖLÜMLERİ:
1. "Temel Bilgiler": Makale Başlığı (metin alanı), Özet/Abstract (uzun
   metin alanı, karakter sayacı), Makale Türü (radio: Araştırma,
   Derleme, Vaka Analizi, Görüş)
2. "Sınıflandırma": Kategori (dropdown/multi-select), Etiketler
   (etiket girişi, chip olarak eklenen)
3. "İçerik": iki seçenekli sekme — "Dosya Yükle" (PDF/DOCX sürükle-bırak
   alanı, dosya boyutu/tip uyarı notu) veya "Metin Editörü" (zengin metin
   editör araç çubuğu: kalın, italik, başlık, liste, alıntı, atıf ekle)
4. "Kaynaklar ve Atıflar" (opsiyonel): kaynak ekleme satırları (başlık,
   URL/DOI, ekle butonu)

SAĞ SIDEBAR: "Gönderim Kılavuzu" kartı — kısa madde listesi (örn.
"Makaleniz gönderildikten sonra otomatik analiz sürecine girer",
"İçerik değişikliği yeni bir analiz gerektirir", "Analiz tamamlanmadan
yayınlanamaz").

ALT KISIM (sabit/sticky footer bar): "Taslak Olarak Kaydet" ikincil
buton, "Analiz için Gönder" birincil buton.
```

#### 13. Taslak Düzenle (`/dashboard/articles/[id]/edit`)

```
Kullanıcı panelinde TASLAK DÜZENLEME sayfasını tasarla. Makale Gönder
formuyla aynı yapıda ama:

- Üstte mevcut durum rozeti gösterilsin (örn. "Taslak" veya "Analiz
  Tamamlandı — düzenleme yeni versiyon oluşturacak")
- Eğer makale zaten analiz edilmiş/yayınlanmışsa, formun en üstünde
  amber renkli bir uyarı bandı: "İçerikte yapacağınız değişiklik yeni
  bir makale versiyonu oluşturacak ve mevcut skor geçersiz hale gelecek,
  yeniden analiz gerekecek."
- Form alanları mevcut verilerle önceden doldurulmuş halde gösterilsin
- Sağ sidebar'da "Versiyon Geçmişi" kartı: v1, v2, v3 listesi, her
  birinin yanında tarih ve skor (varsa)
- Alt sabit bar: "Değişiklikleri Kaydet" ikincil, "Kaydet ve Yeniden
  Gönder" birincil buton
```

#### 14. Analiz Sonucu (`/dashboard/articles/[id]/analysis`)

**Amaç:** En veri-yoğun ekran. Gerçek zamanlı ilerleme + tam şeffaf skor kırılımı.

```
Kullanıcı panelinde bir makalenin ANALİZ SONUCU sayfasını tasarla. Bu
ekranın İKİ durumunu göster:

DURUM A — Analiz Devam Ediyor:
Üstte makale başlığı + "Analiz Ediliyor" durum rozeti. Ortada dikey bir
İLERLEME ÇİZELGESİ (stepper), sadece backend'den gelen TAMAMLANMIŞ
adımlar yeşil tik ile işaretli, şu anki adım animasyonlu/vurgulu, henüz
başlamamış adımlar soluk gri:
1. Doküman İşlendi ✓
2. Konu Analiz Edildi ✓
3. Kaynaklar Araştırıldı ✓
4. İddialar Kontrol Ediliyor (aktif, spinner)
5. AI Yazarlık Analizi (gri/beklemede)
6. Final Skor Hesaplama (gri/beklemede)
Altında not: "Sahte ilerleme gösterilmez, sadece tamamlanan adımlar
işaretlenir." hissini veren gerçekçi bir tasarım olsun.

DURUM B — Analiz Tamamlandı (ana odak, daha detaylı tasarla):
1. Üst özet şeridi: büyük final skor dairesel gösterge (87/100) + "Yayına
   Hazır" durum rozeti + "Yayınla" birincil buton (eğer eşik karşılanmışsa)
2. "Skor Kırılımı" kartı: 6 metrik için yatay çubuk grafik + yüzde değeri
   + ağırlık etiketi: Yapı Uyumu (%20 ağırlık) 90/100, İçerik Kalitesi
   (%20) 85/100, Konu İlgisi (%15) 78/100, Kanıt ve Atıf Kalitesi (%20)
   92/100, Bilgi Doğruluğu (%15) 88/100, Özgünlük (%10) 95/100
3. "AI Yazarlık Değerlendirmesi" kartı (geniş): risk etiketi ("Düşük"),
   güven skoru göstergesi (%74), sınıflandırma açıklaması, tespit
   edilen sinyaller listesi (küçük chip'ler: "Cümle çeşitliliği",
   "Kelime dağılım örüntüsü", "Stil tutarlılığı"), model/dedektör
   versiyon bilgisi (küçük gri metin, footnote gibi)
4. "Kaynak Doğrulama" kartı: tablo halinde her kaynak/atıf satırı —
   kaynak adı, doğrulama durumu ikonu (doğrulandı/kontrol edilemedi/
   şüpheli), not
5. "Değerlendirme Açıklaması" kartı: analiz motorunun ürettiği düz metin
   açıklama, akademik ama anlaşılır dilde
6. Eğer moderasyon notu varsa: "Moderatör Notu" kartı (sarı zemin,
   uyarı ikonu)
7. Alt aksiyon barı: "Yayınla" (uygunsa), "Revizyon Talebi Görüntüle"
   veya "Yeniden Gönder" (uygunsa)

Genel his: veri yoğun ama okunabilir, şeffaflığı vurgulayan.
```

#### 15. Profil Ayarları (`/settings/profile`)

```
Kullanıcı panelinde PROFİL AYARLARI sayfasını tasarla.

LAYOUT: sol tarafta dikey sekme menüsü (Profil Bilgileri, Hesap ve
Güvenlik, Bildirimler, Gizlilik), sağda seçili sekmenin form içeriği.

"Profil Bilgileri" sekmesi (varsayılan aktif):
- Büyük dairesel avatar + "Fotoğrafı Değiştir" / "Kaldır" linkleri
- Ad Soyad, Kullanıcı Adı, Bio (uzun metin alanı, karakter sayacı),
  Kurum/Ünvan, Web Sitesi, ORCID ID alanları
- "Değişiklikleri Kaydet" birincil buton (sağ altta sabit)

"Hesap ve Güvenlik" sekmesi: E-posta adresi (değiştir linki ile),
"Şifre Değiştir" bölümü (mevcut şifre, yeni şifre, yeni şifre tekrar),
"Hesabı Sil" tehlike bölümü (kırmızı outline buton, ayrı kart içinde,
en altta).

"Bildirimler" sekmesi: toggle switch listesi (örn. "Analiz tamamlandığında
e-posta gönder", "Makalem yayınlandığında bildir", "Haftalık özet
e-postası").
```

---

### 4.4 Yönetici / Moderatör Paneli

#### 16. Admin Dashboard (`/admin`)

```
Bir akademik makale platformu için ADMIN DASHBOARD (yönetici paneli ana
sayfası) tasarla.

LAYOUT: sol tarafta koyu renkli sabit yönetici navigasyon menüsü (Genel
Bakış, Moderasyon, Analiz İzleme, Kategoriler, Kullanıcılar, Sistem
Ayarları — ikonlu, aktif öğe vurgulu), sağda ana içerik.

ÜST KPI KARTLARI (5-6 kart yatay grid): Toplam Kullanıcı (12.4K, ↑%3),
Toplam Makale (8.2K), Bekleyen Moderasyon (14, kırmızı vurgu), Aktif
Analiz İşi (7), Bu Ay AI Maliyeti ($482), Sistem Sağlığı (yeşil nokta +
"Tümü Çalışıyor").

ORTA BÖLÜM: iki sütun —
- Sol: "Son 30 Gün Gönderim Trendi" çizgi/alan grafiği
- Sağ: "Durum Dağılımı" halka (donut) grafiği (Yayında, İncelemede,
  Reddedildi, Taslak oranları)

ALT BÖLÜM: "Dikkat Gerektiren Öğeler" listesi — bekleyen moderasyon
öğeleri ve başarısız analiz işleri kısa satırlar halinde, her birinde
"İncele" linki.
```

#### 17. Moderasyon (`/admin/articles`)

```
Admin panelinde MODERASYON sayfasını tasarla (sol admin navigasyonu
sabit kalsın).

ÜST BAR: başlık "Moderasyon Kuyruğu", filtre tab'ları (Tümü, Bekleyen,
İncelemede, Onaylandı, Reddedildi), arama kutusu.

TABLO: her satırda — makale başlığı, yazar, final skor, AI risk etiketi,
gönderim tarihi, durum rozeti, "İncele" butonu.

Bir satıra tıklanınca açılan DETAY PANELİ (sağdan kayan drawer/modal)
tasarla:
- Makale başlık + yazar bilgisi
- Skor kırılımı özeti (kompakt)
- AI yazarlık değerlendirmesi özeti
- "Moderasyon Notu" metin alanı
- Aksiyon butonları: "Onayla ve Yayına Al" (yeşil), "Revizyon Talep Et"
  (amber/outline), "Reddet" (kırmızı outline)
- Geçmiş moderasyon notları/aktivite log'u (varsa) altta liste halinde
```

#### 18. Analiz İzleme (`/admin/analysis`)

```
Admin panelinde ANALİZ İZLEME (analysis monitoring) sayfasını tasarla.

ÜST BAR: başlık "Analiz İşleri", durum filtre chip'leri (Kuyrukta,
İşleniyor, Tamamlandı, Başarısız, Yeniden Denendi), arama/tarih filtresi.

TABLO: her satırda — İş ID (kısa), makale başlığı, durum rozeti (renkli),
başlangıç zamanı, süre, deneme sayısı (retry count), tahmini AI maliyeti,
"Detay" butonu.

Başarısız satırlarda kırmızı vurgu + "Yeniden Kuyruğa Al" küçük ikon
buton.

DETAY GÖRÜNÜMÜ (yan panel veya modal): iş meta verisi (worker ID, pipeline
versiyonu, prompt versiyonu), aşama aşama log/zaman çizelgesi (Doküman
İşleme, Konu Analizi, Araştırma, İddia Kontrolü, AI Analizi, Skor
Hesaplama — her biri süre ve durumuyla), hata mesajı bloğu (başarısızsa,
monospace font, kırmızı kenarlıklı kutu içinde).
```

#### 19. Kategori Yönetimi (`/admin/categories`)

```
Admin panelinde KATEGORİ YÖNETİMİ sayfasını tasarla.

ÜST BAR: başlık "Kategoriler", sağda "Yeni Kategori Ekle" birincil buton,
arama kutusu.

TABLO: her satırda — sürükleme tutamacı ikonu (sıralama için), kategori
ikonu, kategori adı, slug (gri, monospace küçük metin), makale sayısı,
oluşturulma tarihi, aksiyon menüsü (Düzenle, Sil).

"Yeni Kategori Ekle" veya "Düzenle" tıklandığında açılan MODAL formu
tasarla: Kategori Adı, Slug (otomatik türetilen, düzenlenebilir), Açıklama,
İkon Seçici (küçük ikon grid'i), Üst Kategori (opsiyonel dropdown, alt
kategori desteği için), "Kaydet" / "İptal" butonları.

Silme aksiyonunda onay modalı: "Bu kategoriye bağlı 342 makale var, silme
işlemi bu makaleleri kategorisiz bırakacak. Onaylıyor musunuz?" uyarı
metniyle.
```

#### 20. Kullanıcı Yönetimi (`/admin/users`)

```
Admin panelinde KULLANICI YÖNETİMİ sayfasını tasarla.

ÜST BAR: başlık "Kullanıcılar", rol filtre tab'ları (Tümü, Kullanıcı,
Moderatör, Admin), durum filtresi (Aktif, Askıya Alınmış), arama kutusu.

TABLO: her satırda — avatar + isim + kullanıcı adı, e-posta, rol rozeti
(renkli, Kullanıcı/Moderatör/Admin), durum rozeti (Aktif/Askıya Alınmış),
katılım tarihi, toplam makale sayısı, aksiyon menüsü (Rolü Değiştir,
Askıya Al, Profili Görüntüle).

Bir kullanıcıya tıklanınca açılan DETAY PANELİ: kullanıcı profil özeti,
istatistikler (toplam makale, ortalama skor, moderasyon geçmişi),
"Rol Değiştir" dropdown + onay butonu, "Hesabı Askıya Al" tehlike
bölümü (sebep metin alanı + onay butonu).
```

---

### 4.5 Ek / Yardımcı Ekranlar

#### 21. 404 ve Boş Durumlar

```
Bir akademik makale platformu için 404 SAYFA BULUNAMADI ekranı ve genel
BOŞ DURUM (empty state) bileşen setini tasarla.

404 EKRANI: ortalanmış düzen, büyük stilize "404" tipografisi veya soyut
illüstrasyon, "Aradığın sayfa bulunamadı" başlığı, kısa açıklama, "Anasayfaya
Dön" birincil buton.

BOŞ DURUM VARYANTLARI (3 farklı kart halinde göster):
1. "Henüz makale yok" (Makalelerim sayfası için) — belge ikonu + mesaj +
   "İlk Makaleni Gönder" buton
2. "Sonuç bulunamadı" (arama/filtre için) — büyüteç ikonu + mesaj +
   "Filtreleri Temizle" linki
3. "Bildirim yok" (bildirim merkezi için) — çan ikonu + sade mesaj

Aynı tasarım dilini (renk paleti, tipografi, buton stili) koru.
```

---

## 5. Sonraki Adım Önerisi

- Parked pack: `docs/stitch-exports/stitch_scholarflow_design_system.zip` (D-025). Do not open or implement from it until backend phases are complete and ENSAR approves.
- Tüm ekranlar Stitch'te üretildikten sonra, gerçek implementasyon Next.js App Router + Tailwind CSS ile yapılacağı için, Stitch çıktısındaki bileşenleri `packages/` mimarisine göre değil, `apps/web` altındaki Presentation katmanına (route bazlı) eşleyerek kodlayacağız.
- Stitch export'unu doğrudan production koduna kopyalamayın — sadece görsel/yapısal referans olarak kullanın; erişilebilirlik (WCAG), semantik HTML ve gerçek veri bağlamaları elle yeniden yazılacak.
- Bu dosyayı ekranlar değiştikçe (`masterplan.md` bölüm 33-38 güncellenirse) senkron tutmayı unutma.
