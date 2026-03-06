# Kandilli Archive Digitizer — Proje Hafızası

## Proje
115 Yıllık İklim Verisi Hackathonu (Boğaziçi Üniversitesi + KRDAE, Mart 2026)
Repo: /Users/miraymavi/codeerik

## Dosya Durumu
- `digitize.py` — TAM ÇALIŞIYOR, test edildi, doğrulandı
- `digitize2.py` — ESKİ VERSİYON (karşılaştırma için tutuluyor)
- `predict.py` — PLACEHOLDER, henüz yazılmadı
- `app.py` — PLACEHOLDER, henüz yazılmadı
- `requirements.txt` — güncel

## Kritik Teknik Notlar

### TIF Açma
OpenCV eski JPEG-sıkıştırmalı TIF'leri açamıyor (Compression Tag 6).
Pillow ile açıp numpy array'e çevir:
```python
pil_img = Image.open(path).convert("RGB")
img = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
```

### Y Ekseni Kalibrasyonu (Termogram 1987)
Excel referans verisinden geri hesaplandı:
- y_min = -22.9°C
- y_max = 39.4°C
(Varsayılan -40/+50 YANLIŞ — chart kağıdının gerçek aralığı bu)

### Mavi Mürekkep HSV Aralığı
Arşiv kağıtlarında mavi-mor mürekkep Hue 120-180 arasında:
```python
cv2.inRange(hsv, [95,40,20], [140,255,220])  # mavi
cv2.inRange(hsv, [140,30,15], [180,255,200]) # mor-mavi
```

### Rüzgar Yön Kağıtları
Portrait orientation (4300H x 2896W). `--transposed` flag ile işlenir.
Y ekseni = zaman, X ekseni = yön. Per-row median X kullanılır.

## Doğrulama Sonuçları

| Adım | Korelasyon | MAE |
|------|-----------|-----|
| İlk hali (tarih mapping yanlış) | 0.001 | 9.53°C |
| Tarih mapping düzeltildi | 0.170 | 7.09°C |
| + remove_grid_lines + keep_largest_component | 0.761 | 3.00°C |
| + Doğru Y kalibrasyonu | 0.761 | 3.00°C |
| + Gap interpolation (kısa boşluklar) | **0.751** | **2.65°C** |

Referans: `Sayısallaştırılmış Veri/1987_Sıcaklık_Saat Başı.xlsx`

## Pipeline Mimarisi (digitize.py)

```
load_image (Pillow)
  → find_plot_area (en büyük kontur)
  → isolate_curve (siyah: adaptif threshold | mavi/kırmızı: HSV mask)
  → remove_grid_lines (morfolojik yatay kernel + border mask)
  → keep_largest_component (siyah mürekkep için, drum overlap problemi)
       [mavi/kırmızı için atlanır — single_trace=True]
  → extract_curve_pixels
       normal: per-column median Y + kısa gap interpolation
       transposed: per-row median X + kısa gap interpolation
  → pixels_to_dataframe (piksel → zaman/değer)
  → smooth_curve (Savitzky-Golay, pencere=21)
```

## Denenen ve İşe Yaramayan Şeyler
- CLAHE: coverage %100'den %26'ya düşürdü — KULLANMA
- Skeletonize (scikit-image): korelasyonu 0.761→0.732 düşürdü — KULLANMA
- Hough tabanlı grid silme: yanlış component seçimine yol açtı — KULLANMA
- Widest-span CC: grid çizgileri seçiliyor — KULLANMA

## Veri Tipleri ve Durumları

| Chart Tipi | Mürekkep | --ink | --transposed | Durum |
|---|---|---|---|---|
| Termogram (haftalık) | Siyah | black | hayır | ✅ r=0.75 |
| Rüzgar Hızı (günlük) | Siyah | black | hayır | ✅ ~%100 kapsama |
| Rüzgar Yön (günlük) | Siyah | black | EVET | ⚠️ tespit çalışıyor, kalibrasyon belirsiz |
| Yağış 1942 | Mavi | blue | hayır | ✅ Overlay doğrulandı |
| Yağış 1985 | Mavi | blue | hayır | ✅ ~4400 nokta/gün |
| Yağış 1985 eksik günler | — | — | — | ⚠️ bazı TIF'ler boş (örn. EKİM-07) |

## Yağış Kalibrasyonu Notu
Ombrograf kümülatif ölçer. Excel doğrulaması şu an başarısız çünkü:
1. Günün başındaki gauge seviyesi bilinmiyor (reset zamanı belirsiz)
2. Y_max=10mm varsayımı doğrulanmamış
Overlay görsel olarak doğru görünüyor ama sayısal doğrulama yapılamıyor.

## Sıradaki Adımlar
1. predict.py — Prophet ile nem + basınç tahmini (2025-2030)
   - `Nem-1980-2014.xlsx`: rows=365 gün, cols=yıllar (wide format → long format)
   - `Basınç_Şubat_1984-2013.xls`: Şubat ayı günlük basınç
2. app.py — Streamlit dashboard
3. Hackathon sunumu
