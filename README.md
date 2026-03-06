# Kandilli Archive Digitizer

Kandilli Rasathanesi ve Deprem Araştırma Enstitüsü (KRDAE), 115 yıllık meteoroloji kayıtlarını analog grafik kağıtları üzerinde tutmaktadır. Bu kağıtlar; termograflar, barograflar ve higrograflar tarafından otomatik olarak çizilmiş sürekli eğrilerden oluşmakta ve sıcaklık, basınç, nem, rüzgar hızı, yağış gibi iklim değişkenlerini dakika dakika kayıt altına almaktadır. Bu proje, söz konusu analog arşivi dijital veri setine dönüştüren, dönüştürülen veriyi görselleştiren ve gelecek dönem iklim projeksiyonları üreten uçtan uca bir pipeline geliştirmeyi hedeflemektedir.

---

## Veri Kaynağı

Projede iki tür veri kullanılmaktadır:

### Analog TIF Taramaları
Kandilli Rasathanesi'nin 1911'den günümüze uzanan grafik kağıtlarının yüksek çözünürlüklü taramaları. Mevcut örnekler:

| Yıl | Tür | Açıklama |
|-----|-----|----------|
| 1942 | Yağış | Ekim ayı kümülatif yağış kaydı, mavi mürekkep, turuncu kağıt |
| 1985 | Yağış | Ekim ayı yağış kaydı, mavi mürekkep, yeşil kağıt |
| 1987 | Sıcaklık, Rüzgar Hızı, Rüzgar Yönü | Mart ayı kayıtlar; termogram haftalık, rüzgar günlük |

Her grafik kağıdı yapılandırılmış bir formata sahiptir:
- **X ekseni:** Zaman (saat bazında günler veya gün bazında haftalar)
- **Y ekseni:** Ölçüm değeri (°C, m/s, mm, derece)
- **Eğri:** Cihazın ibre ile kağıda çizdiği sürekli ölçüm kaydı

### Sayısallaştırılmış Veri (Referans ve Doğrulama)
Daha önce elle dönüştürülmüş ve doğrulama amacıyla kullanılan veri setleri:

| Dosya | İçerik | Kullanım |
|-------|--------|----------|
| `1987_Sıcaklık_Saat Başı.xlsx` | 1987 saatlik sıcaklık | Termogram doğrulaması (r=0.75) |
| `Yağış_1980-2019.xlsx` | Günlük yağış 1980–2019 | Yağış referansı |
| `Nem-1980-2014.xlsx` | Günlük nem 1980–2014 | predict.py için |
| `Basınç_Şubat_1984-2013.xls` | Şubat basınç 1984–2013 | predict.py için |

---

## Proje Mimarisi

Sistem üç ana bileşenden oluşmaktadır.

### 1. CV Sayısallaştırma Pipeline'ı — `digitize.py`

Analog grafik kağıtlarından sayısal zaman serisi verisi çıkarmak için geliştirilmiş bilgisayarlı görü pipeline'ı.

**Teknik not — TIF formatı:** Kandilli arşivindeki TIF dosyaları eski JPEG sıkıştırması (Compression Tag 6) kullanmaktadır. OpenCV bu formatı açamaz. Bu nedenle tüm dosya yüklemeleri Pillow kütüphanesi üzerinden yapılmakta, ardından numpy array'e dönüştürülerek OpenCV pipeline'ına aktarılmaktadır.

**Pipeline adımları:**

1. **Plot alanı tespiti** — Görüntü üzerindeki en büyük kontur bulunarak grafik alanı crop edilir, kenar parazitleri kırpılır.

2. **Eğri izolasyonu** — Mürekkep rengine göre iki yol:
   - Siyah mürekkep: adaptif Gaussian eşikleme (`blockSize=31, C=8`)
   - Mavi/mor mürekkep: HSV renk maskesi (iki aralık: Hue 95–140 ve 140–180, arşiv mürekkebinin mavi-mor spektrumunu kapsar)
   - Kırmızı mürekkep: kırmızı HSV sınırları (0–10 ve 160–180 Hue)

3. **Izgara çizgisi temizleme** — Yatay ızgara çizgileri geniş morfolojik kernel ile tespit edilip çıkarılır. Ek olarak görüntü kenarları maskelenerek chart çerçeve piksellerinin eğri tespitini bozması önlenir.

4. **Baskın bileşen seçimi** — Siyah mürekkepli termogramlar için kritik adım: eski Kandilli kağıtları silindirik bir sisteme yerleştirildiğinden, silindir her hafta aynı kağıt üzerine döner ve iki haftalık iz üst üste binebilir. `keep_largest_component` fonksiyonu en büyük bağlı bileşeni seçerek bu ikinci izi eler. Mavi/kırmızı mürekkepte tek iz olduğundan bu adım atlanır (`single_trace=True`).

5. **Piksel koordinatı çıkarımı** — İki mod:
   - Normal (yatay chart): her x sütununun koyu piksel medyanı → eğrinin y pozisyonu
   - Transposed (dikey chart, örn. Rüzgar Yönü): her y satırının koyu piksel medyanı → eğrinin x pozisyonu
   - Kısa boşluklar (≤ chart genişliğinin %1'i) lineer interpolasyon ile doldurulur; büyük boşluklar veri yokluğu olarak bırakılır
   - 11-pencereli kayan medyan ile sütun bazlı aykırı değerler temizlenir

6. **Değer dönüşümü** — Piksel koordinatları kullanıcının girdiği `y_min`, `y_max` ve zaman aralığı ile gerçek değerlere çevrilir.

7. **Smoothing** — Sayısallaştırma gürültüsü Savitzky-Golay filtresi (pencere=21, derece=3) ile azaltılır. Ham değerler `value_raw` sütununda saklanır.

**Y ekseni kalibrasyonu:** Y eksenindeki ölçek, chart kağıdının fiziğine bağlı olduğundan otomatik tespit güvenilmez. 1987 termogramları için `1987_Sıcaklık_Saat Başı.xlsx` referans verisiyle geri hesaplama yapılmış; gerçek aralık `y_min=-22.9°C`, `y_max=39.4°C` olarak belirlenmiştir (varsayılan -40/+50 bu kağıtlar için yanlış).

**Doğrulama — Termogram 1987:**
`1987_Sıcaklık_Saat Başı.xlsx` ile saatlik karşılaştırma:

| Adım | Korelasyon (r) | MAE |
|------|---------------|-----|
| Sadece medyan (baseline) | 0.170 | 7.09°C |
| + Grid temizleme + largest CC | 0.761 | 3.00°C |
| + Kısa gap interpolation | **0.751** | **2.65°C** |

**Portrait orientation kağıtlar (Rüzgar Yönü):**
Rüzgar yön kağıtları dikey taranmıştır (4300×2896 piksel). Zaman ekseni Y, yön ekseni X'tir. `--transposed` parametresi ile per-row medyan X kullanılarak okunur.

**Kullanım:**
```bash
# Tek dosya
python digitize.py --input dosya.tif --y_min -22.9 --y_max 39.4 \
  --start "1987-03-02 00:00" --end "1987-03-09 00:00" --overlay

# Batch
python digitize.py --batch klasor/ --y_min 0 --y_max 10 \
  --start "1985-10-01 00:00" --end "1985-10-02 00:00" --ink blue

# Rüzgar yönü (portrait)
python digitize.py --input ruzgar_yon.tif --y_min 0 --y_max 360 \
  --start "1987-03-02 00:00" --end "1987-03-03 00:00" --transposed
```

**Parametreler:**

| Parametre | Açıklama | Varsayılan |
|-----------|----------|------------|
| `--y_min` / `--y_max` | Y ekseni gerçek değer sınırları | -40 / 50 |
| `--start` / `--end` | Chart'ın kapsamı dönemi | 1900-01-01 / 08 |
| `--ink` | Mürekkep rengi: `black`, `blue`, `red` | black |
| `--overlay` | Tespit edilen eğriyi orijinal görüntü üzerine çizer | — |
| `--transposed` | Portrait orientation (Rüzgar Yönü gibi) | — |
| `--no_smooth` | Savitzky-Golay smoothing'i devre dışı bırakır | — |

---

### 2. İnteraktif Dashboard — `app.py`

IDEAS:
Streamlit üzerine inşa edilen web arayüzü:
- TIF yükleme ve canlı sayısallaştırma
- Overlay ile görsel doğrulama
- Çok dönemli iklim karşılaştırması
- Anomali tespiti
- CSV indirme

---

### 3. İklim Tahmin Modeli — `predict.py`

IDEAS:
Sayısallaştırılmış tarihsel veri üzerinden gelecek projeksiyonları:
- `Nem-1980-2014.xlsx` ve `Basınç_Şubat_1984-2013.xls` ile eğitim
- Prophet kütüphanesi ile trend + mevsimsellik modelleme
- Güven aralıklı projeksiyon çıktıları

---

## Kurulum

```bash
pip install -r requirements.txt
```

**Gereksinimler:**
```
opencv-python>=4.8.0
numpy>=1.24.0
pandas>=2.0.0
scipy>=1.11.0
plotly>=5.17.0
streamlit>=1.28.0
prophet>=1.1.4
openpyxl>=3.1.2
xlrd>=2.0.2
Pillow>=10.0.0
```

---

## Klasör Yapısı

```
.
├── Graf Kağıtları Tarama/     # Ham TIF taramaları
├── Sayısallaştırılmış Veri/   # Referans Excel dosyaları
├── digitize.py                # CV sayısallaştırma pipeline'ı
├── predict.py                 # İklim tahmin modeli (yapım aşaması)
├── app.py                     # Streamlit dashboard (yapım aşaması)
├── requirements.txt
└── README.md
```
