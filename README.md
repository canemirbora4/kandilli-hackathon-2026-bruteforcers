# Kandilli Archive Digitizer

Kandilli Rasathanesi ve Deprem Araştırma Enstitüsü (KRDAE), 115 yıllık meteoroloji kayıtlarını analog grafik kağıtları üzerinde tutmaktadır. Bu kağıtlar; termograflar, barograflar ve higrograflar tarafından otomatik olarak çizilmiş sürekli eğrilerden oluşmakta ve sıcaklık, basınç, nem, rüzgar hızı, yağış gibi iklim değişkenlerini dakika dakika kayıt altına almaktadır. Bu proje, söz konusu analog arşivi dijital veri setine dönüştüren uçtan uca bir pipeline geliştirmeyi hedeflemektedir.

---

## Proje Mimarisi

Sistem iki ana bileşenden oluşmaktadır:

### 1. CV Sayısallaştırma Pipeline'ı — `digitize.py`

Analog grafik kağıtlarından sayısal zaman serisi verisi çıkarmak için geliştirilmiş bilgisayarlı görü pipeline'ı.

**Pipeline adımları:**

1. **Görüntü yükleme** — Pillow ile TIF açma, OpenCV'ye dönüştürme (eski JPEG sıkıştırmalı TIF'ler OpenCV'de açılamaz)
2. **Plot alanı tespiti** — Kullanıcı start/end point verdiyse bu noktalar + trajectory ile plot alanı hesaplanır; verilmediyse en büyük kontur bulunarak grafik alanı crop edilir
3. **Eğri izolasyonu** — Mürekkep rengine göre:
   - Siyah: adaptif Gaussian eşikleme
   - Mavi/mor: HSV renk maskesi (Hue 95–180)
   - Kırmızı: HSV renk maskesi (Hue 0–10, 160–180)
4. **Izgara çizgisi temizleme** — Morfolojik yatay/dikey kernel ile grid temizleme + kenar maskeleme
5. **Baskın bileşen seçimi** — Üst üste binen izlerden doğru olanı seçme (siyah mürekkepte silindir tekrarı problemi)
6. **Piksel koordinatı çıkarımı** — Kullanıcının trajectory'sine göre farklı yöntemler:
   - **Trajectory varsa:** `_extract_guided_path()` — weighted centroid tracking (aşağıda detaylı)
   - **Mavi mürekkep:** HSV binary mask veya R-channel tracking
   - **Siyah mürekkep:** Per-column grayscale intensity tracking
7. **Grid border tespiti** — Nem kağıtlarında pembe grid (logaritmik), sıcaklık kağıtlarında altın grid (lineer) otomatik tespit edilir
8. **Değer dönüşümü** — Piksel → zaman/değer eşlemesi (grid borders ile kalibrasyon)
9. **Smoothing** — Savitzky-Golay filtresi (pencere=21, derece=3)

**Doğrulama (Termogram 1987):** r=0.75 korelasyon, MAE=2.65°C

#### Kullanıcı Etkileşimi: Start Point, End Point ve Trajectory

Digitize pipeline'ı web arayüzünden üç temel kullanıcı girdisi alır:

- **Start Point (başlangıç noktası):** Eğrinin kağıt üzerinde başladığı piksel koordinatı (x, y). Kullanıcı chart görüntüsü üzerinde tıklayarak işaretler.
- **End Point (bitiş noktası):** Eğrinin bittiği piksel koordinatı.
- **Trajectory (izleme yolu):** Kullanıcının eğri boyunca çizdiği nokta serisi. Bu noktalar eğrinin kesin konumunu belirlemez — yalnızca **yön rehberi** olarak kullanılır. Gerçek y-pozisyonu mürekkep yoğunluğunun ağırlıklı centroid'inden hesaplanır.

`_extract_guided_path()` fonksiyonu 4 aşamada çalışır:

1. **Biased rough estimate:** Gaussian bias ile trajectory'ye yakın bölgelerdeki mürekkep yoğunluğu aranır
2. **Weighted centroid refinement:** Dar bantta intensity-weighted centroid hesaplanır (argmax yerine centroid kullanılır — annotation, grid crossing gibi izole gürültülere karşı dayanıklı)
3. **Continuity-aware smoothing:** Forward-backward tracking ile fiziksel olarak imkansız sıçramalar engellenir
4. **Guide-aware outlier correction:** Trend'den ve trajectory'den aşırı sapan noktalar düzeltilir

Start ve end noktaları, eğrinin uç kısımlarında ground truth olarak kabul edilir ve smooth blend zone ile nihai sonuca pin'lenir.

#### Labeler: Bozuk Bölge Onarımı

Kullanıcı kağıt üzerindeki sorunlu bölgeleri (dağılma, siliklik, kağıt defekti, veri yokluğu) bounding box ile işaretleyebilir. Her kutu için enter/exit noktaları belirtilir. `labeler.py` bu bölgeleri trajectory tabanlı interpolasyon ile onarır — pipeline onarılmış görüntü üzerinde çalışır.

### 2. Web Arayüzü

- **Backend:** `api.py` — FastAPI sunucu (port 8000). TIF görüntüleme, thumbnail, kayıt CRUD, sayısallaştırma endpoint'leri. Çalışma dizinindeki TIF klasörlerini (OCAK, ARALIK, TERMOGRAM, vb.) otomatik tarar ve browse API'si sunar.
- **Frontend:** `frontend/` — Next.js 16 + React 19 + Tailwind CSS.
  - **Ana sayfa:** Veri tipi → yıl → ay → galeri görünümü ile chart arşivini tarayıcı
  - **Admin sayfası:** Uzman annotasyon arayüzü (Konva canvas). Start/end point işaretleme, eğri boyunca trajectory çizme, bozuk bölgelere bounding box ekleme, sayısallaştırma sonuçlarını görüntüleme
- **Veritabanı:** Prisma + SQLite (`KandilliRecord` modeli). Backend kendi SQLite'ını, frontend Prisma üzerinden ayrı bir SQLite kullanır.
- **Yardımcı modüller:**
  - `labeler.py` — Annotasyon kutularındaki bozuk bölgeleri trajectory ile onarma
  - `trajectory_tool.html` — Eğri takip aracı (`/tool` endpoint'i)

---

## Kurulum

### Backend

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### Frontend

```bash
cd frontend
npm install
npx prisma generate
npx prisma db push
```

---

## Çalıştırma

### Backend sunucusu

```bash
source .venv/bin/activate
uvicorn api:app --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd frontend
npm run dev
```

Tarayıcıda `http://localhost:3000` adresinden arayüze, `http://localhost:3000/admin` adresinden uzman annotasyon arayüzüne erişebilirsiniz.

### Veri Dizinleri

Backend, çalışma dizinindeki TIF klasörlerini otomatik tarar. Desteklenen yapılar:

- `ARALIK/2004_ARALIK-01.tif` — düz dizin yapısı
- `Nem-GÜNLÜK/{yıl}/{ay}/...tif` — nem verileri
- `TERMOGRAM-1_1911-2005/{yıl}/{frekans}/{ay}/...tif` — sıcaklık verileri

---

## CLI Kullanımı

`digitize.py` doğrudan komut satırından da kullanılabilir:

```bash
# Tek dosya sayısallaştırma
python digitize.py --input dosya.tif --y_min -22.9 --y_max 39.4 \
  --start "1987-03-02 00:00" --end "1987-03-09 00:00" --overlay

# Kullanıcı yönlendirmeli (start/end point + trajectory)
python digitize.py --input dosya.tif --y_min -5 --y_max 45 \
  --start_pt "80,500" --end_pt "3400,300" \
  --guide "200,480;800,420;1500,350;2500,310" \
  --start "1987-03-02 00:00" --end "1987-03-09 00:00"

# Batch işleme
python digitize.py --batch klasor/ --y_min 0 --y_max 10 \
  --start "1985-10-01 00:00" --end "1985-10-02 00:00" --ink blue
```

| Parametre | Açıklama | Varsayılan |
|-----------|----------|------------|
| `--y_min` / `--y_max` | Y ekseni değer sınırları | -40 / 50 |
| `--start` / `--end` | Zaman aralığı | 1900-01-01 / 08 |
| `--ink` | Mürekkep rengi: `black`, `blue`, `red` | black |
| `--overlay` | Eğriyi orijinal görüntü üzerine çizer | — |
| `--transposed` | Portrait orientation (dikey kağıtlar) | — |
| `--no_smooth` | Smoothing'i devre dışı bırakır | — |
| `--start_pt` | Eğri başlangıç pikseli (x,y) | — |
| `--end_pt` | Eğri bitiş pikseli (x,y) | — |
| `--guide` | Yön rehberi noktaları (x1,y1;x2,y2;...) | — |
| `--seed` | Bileşen seçimi için seed piksel (x,y) | — |

---

## Klasör Yapısı

```
.
├── api.py                    # FastAPI backend sunucu
├── digitize.py               # CV sayısallaştırma pipeline'ı
├── labeler.py                # Annotasyon bölge onarımı
├── trajectory_tool.html      # Eğri takip aracı
├── requirements.txt          # Python bağımlılıkları
├── frontend/                 # Next.js web arayüzü
│   ├── app/                  # Sayfalar ve API route'ları
│   │   ├── page.tsx          # Ana sayfa (galeri)
│   │   ├── admin/page.tsx    # Uzman annotasyon arayüzü
│   │   └── api/              # Next.js API route'ları
│   ├── components/           # React bileşenleri
│   │   ├── AnnotationCanvas.tsx   # Konva canvas (start/end, trajectory, box)
│   │   ├── ExpertSidebar.tsx      # Mod seçimi, kutu editörü, aksiyonlar
│   │   ├── ChartViewer.tsx        # Zoom/pan görüntü görüntüleyici
│   │   └── DateCalendar.tsx       # Tarih seçici
│   ├── lib/prisma.ts         # Prisma client
│   └── prisma/               # Veritabanı şeması ve migration'lar
└── README.md
```
