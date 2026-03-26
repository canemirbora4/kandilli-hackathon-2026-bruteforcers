# Kandilli Archive Digitizer

Kandilli Rasathanesi ve Deprem Araştırma Enstitüsü (KRDAE), 115 yıllık meteoroloji kayıtlarını analog grafik kağıtları üzerinde tutmaktadır. Bu kağıtlar; termograflar, barograflar ve higrograflar tarafından otomatik olarak çizilmiş sürekli eğrilerden oluşmakta ve sıcaklık, nem gibi iklim değişkenlerini dakika dakika kayıt altına almaktadır. Bu proje, söz konusu analog arşivi dijital veri setine dönüştüren uçtan uca bir pipeline geliştirmeyi hedeflemektedir.

---

## Proje Mimarisi

Sistem üç ana bileşenden oluşmaktadır:

### 1. CV Sayısallaştırma Pipeline'ı — `digitize.py`

Analog grafik kağıtlarından sayısal zaman serisi verisi çıkarmak için geliştirilmiş bilgisayarlı görü pipeline'ı.

**Pipeline adımları:**

1. **Görüntü yükleme** — Pillow ile TIF açma, OpenCV'ye dönüştürme (eski JPEG sıkıştırmalı TIF'ler OpenCV'de açılamaz)
2. **Plot alanı tespiti** — Kullanıcı start/end point verdiyse bu noktalar + trajectory ile plot alanı hesaplanır; verilmediyse en büyük kontur bulunarak grafik alanı crop edilir
3. **Eğri izolasyonu** — Grafik türüne göre:
   - **NEM (nem kağıtları):** R-kanalı yoğunluk takibi — hem siyah hem lacivert/mavi mürekkep için çalışır; renkli kağıt zemininde R-kanalı mürekkebi etkin biçimde ayırır
   - **SICAKLIK (termogram):** Adaptif Gaussian eşikleme — koyu mürekkebin portakal/bej zeminden izolasyonu
4. **Izgara çizgisi temizleme** — Morfolojik yatay/dikey kernel ile grid temizleme + kenar maskeleme
5. **Baskın bileşen seçimi** — Üst üste binen izlerden doğru olanı seçme
6. **Piksel koordinatı çıkarımı** — Kullanıcının trajectory'sine göre `_extract_guided_path()` ile weighted centroid tracking (detay aşağıda)
7. **Grid border tespiti** — Nem kağıtlarında pembe grid (logaritmik-doğrusal non-lineer ızgara), sıcaklık kağıtlarında lineer ızgara otomatik tespit edilir
8. **Değer dönüşümü** — Piksel → zaman/değer eşlemesi (grid borders ile kalibrasyon)
9. **Non-lineerlik düzeltmesi** — NEM kağıtları için ölçüm tabanlı LUT (`_NEM_GRID_NORM`) ile pixel konumunu gerçek nem değerine eşler; sıcaklık kağıtları lineer olduğu için LUT uygulanmaz
10. **Smoothing** — Savitzky-Golay filtresi (pencere=21, derece=3)

#### NEM Kağıdı Non-Lineerlik LUT

Kandilli'de kullanılan nem kağıtları (Lambrecht 82H ve Bestell-Nr. 205079) fiziksel olarak aynı ızgara aralıklarına sahiptir. Izgara aralıkları elle ölçülerek aşağıdaki normalize LUT türetilmiştir:

| Aralık | Ölçüm (birim) | Norm (0–1) |
|--------|--------------|-----------|
| 0–10%  | 54           | 0.000     |
| 10–20% | 44           | 0.181     |
| 20–30% | 34           | 0.328     |
| 30–40% | 28           | 0.441     |
| 40–50% | 24           | 0.535     |
| 50–60% | 21           | 0.615     |
| 60–70% | 21           | 0.686     |
| 70–80% | 21           | 0.756     |
| 80–90% | 22           | 0.826     |
| 90–100%| 30           | 0.900     |

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

---

### 2. Web Arayüzü

#### Backend — `api.py`

FastAPI sunucu (port 8000). Çalışma dizinindeki TIF klasörlerini otomatik tarar ve aşağıdaki endpoint'leri sunar:

| Endpoint | Yöntem | Açıklama |
|----------|--------|----------|
| `/health` | GET | Sunucu durumu |
| `/api/data-types` | GET | Mevcut veri türleri |
| `/api/frequencies/{type}/{year}` | GET | Frekans listesi (Daily/Weekly) |
| `/api/months/{type}/{year}` | GET | Ay listesi |
| `/api/files/{type}` | GET | Dosya listesi |
| `/api/tiff/{path}` | GET | TIF görüntüsü |
| `/api/thumbnail/{path}` | GET | Küçük önizleme |
| `/api/records` | GET / POST | Kayıt listeleme / oluşturma |
| `/api/records/{id}` | GET / PUT / DELETE | Kayıt okuma / güncelleme / silme |
| `/digitize` | POST | Sayısallaştırma pipeline'ı |
| `/digitize/upload` | POST | Yükleme ile sayısallaştırma |

#### Frontend — `frontend/`

Next.js + React + Tailwind CSS. İki ana sayfa:

**`/arsiv` — Arşiv Sayfası**
- Veri türü → Yıl → Ay → Gün galerisi ile 115 yıllık arşivi tarama
- Tam ekran görüntüleyici: zoom/pan, bounding box overlay, dijitalize edilmiş eğri SVG overlay
- Eğri üzerinde mouse hover → anlık nem/sıcaklık değeri gösterimi (y-proximity kontrolü ile yalnızca eğri üzerinde aktif)
- İstatistik paneli: Min, Max, Ort, Std, Nokta sayısı, sparkline
- Kullanılabilirlik durumu: ✓ Kullanılabilir / ✗ Kullanılamaz
- **JSON** butonu: `line_x` + `line_y` verisini panoya kopyalar
- **Kaydı Sil** butonu: DB kaydını tamamen siler

**`/admin` — Uzman Annotasyon Arayüzü**
- Konva canvas üzerinde start/end point işaretleme
- Eğri boyunca trajectory çizme (yön rehberi)
- Sorunlu bölgelere bounding box ekleme
- Kalibrasyon noktaları ile y-ekseni kalibrasyonu
- Sayısallaştırma sonrası: istatistikler, eğri hover tooltip, **JSON** kopyalama
- Kayıt DB'ye kaydetme / güncelleme

#### Veritabanı

SQLite (`kandilli.db` — backend tarafında, FastAPI ile yönetilir). Prisma şeması `frontend/prisma/schema.prisma` içinde tanımlıdır.

`KandilliRecord` modeli:

| Alan | Tip | Açıklama |
|------|-----|----------|
| `id` | Int | Birincil anahtar |
| `path` | String | TIF dosya yolu |
| `type` | String | Veri türü (Nem / Sıcaklık) |
| `timestamp` | String | Kayıt tarihi |
| `isUsable` | Boolean | Kullanılabilirlik durumu |
| `result` | JSON | Annotation + digitize çıktısı |

`result` alanının yapısı:
```json
{
  "start_point": [x, y],
  "end_point": [x, y],
  "trajectory": [[x, y], ...],
  "bounding_boxes": [...],
  "digitize": {
    "line_x": ["2024-01-01 00:00", ...],
    "line_y": [65.2, 66.1, ...],
    "pixel_x": [120, 125, ...],
    "pixel_y": [340, 338, ...],
    "stats": { "min": 25.4, "max": 95.0, "mean": 69.6, "std": 28.3 }
  }
}
```

---

### 3. Zaman Serisi Analizi ve Makine Öğrenmesi (`master` branch)

Projenin yalnızca CV dijitalleştirme adımıyla sınırlı kalınmamış, elde edilen veri setleri kullanılarak **Tahmin (Forecasting)** ve **Korelasyon Analizleri** gerçekleştirilmiştir. 

> **ÖNEMLİ:** Makine öğrenmesi modelleri, trend analizleri ve Jupyter Notebook'ları içeren (`.ipynb` ve `.py` uzantılı) kod tabanı projenin **`master`** branch'indedir (`git checkout master`).

**Bu araçlarla gerçekleştirilen analizler:**

1. **Çiy Noktası (Dew Point) Türetilmesi:**
   Sıcaklık ve nem değerleri *Magnus formülü* kullanılarak "Çiy Noktası" değerine çevrilmiş, 1912-2021 arasında her on yılda $0.2254\,^{\circ}$C'lik bir ısınma / nem artış trendi ispatlanmış ve Fourier harmonikleriyle mevsimsellikten arındırılmıştır.
   
2. **Forecasting Benchmark (Modellerin Karşılaştırılması):**
   109 yıllık eğitim setiyle 4 farklı tahmin modeli karşılaştırılmıştır:
   - **SARIMA** (İstatistiksel mevsimsel analiz - $R^2: \sim0.89$)
   - **Prophet** (Meta'nın açık kaynak algoritması)
   - **LSTM** (Derin Öğrenme: RNN tabanlı model - $R^2: \sim0.93$)
   - **PatchTST** (Transformer tabanlı mimari ile en iyi sonuç - $R^2: 0.94$)

3. **Gerçek Hayat Korelasyonları:**
   Elde edilen iklimsel değişim trendi, İstanbul şehir hayatıyla ve altyapı ihtiyaçlarıyla doğrusal olarak eşleştirilmiştir:
   - **Doğalgaz Tüketimi (İBB & İGDAŞ):** $r = -0.88$ (Kesin ters orantı)
   - **Güneş Çarpması Vakaları (Google Trends):** $r = 0.62$
   - **Klima Kullanımı/Aramaları (Google Trends):** $r = 0.61$ 
   - **Şehir Su Tüketimi / Barajlar (İBB AÇIK VERİ):** $r = 0.53$

---

## Kurulum

### Backend

```bash
pip install -r requirements.txt
uvicorn api:app --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Tarayıcıda `http://localhost:3000/arsiv` arşiv sayfasına, `http://localhost:3000/admin` annotasyon arayüzüne erişebilirsiniz.

---

### Veri Dizinleri

Backend, çalışma dizinindeki TIF klasörlerini otomatik tarar. Desteklenen yapılar:

- `NEM/{yıl}/{ay}/...tif` — nem verileri
- `TERMOGRAM/{yıl}/{frekans}/{ay}/...tif` — sıcaklık verileri

---

## CLI Kullanımı

`digitize.py` doğrudan komut satırından da kullanılabilir:

# Kullanıcı yönlendirmeli (start/end point + trajectory)
python digitize.py --input dosya.tif --y_min -5 --y_max 45 \
  --start_pt "80,500" --end_pt "3400,300" \
  --guide "200,480;800,420;1500,350;2500,310" \
  --start "1987-03-02 00:00" --end "1987-03-09 00:00"
```

| Parametre | Açıklama | Varsayılan |
|-----------|----------|------------|
| `--y_min` / `--y_max` | Y ekseni değer sınırları | -40 / 50 |
| `--start` / `--end` | Zaman aralığı | 1900-01-01 / 08 |
| `--ink` | Mürekkep rengi: `black`, `blue` | black |
| `--overlay` | Eğriyi orijinal görüntü üzerine çizer | — |
| `--transposed` | Portrait orientation (dikey kağıtlar) | — |
| `--no_smooth` | Smoothing'i devre dışı bırakır | — |
| `--start_pt` | Eğri başlangıç pikseli (x,y) | — |
| `--end_pt` | Eğri bitiş pikseli (x,y) | — |
| `--guide` | Yön rehberi noktaları (x1,y1;x2,y2;...) | — |
| `--seed` | Bileşen seçimi için seed piksel (x,y) | — |

---