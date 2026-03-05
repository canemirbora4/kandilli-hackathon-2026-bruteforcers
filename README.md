# Kandilli Archive Digitizer 

Kandilli Rasathanesi ve Deprem Araştırma Enstitüsü (KRDAE), 115 yıllık meteoroloji kayıtlarını analog grafik kağıtları üzerinde tutmaktadır. Bu kağıtlar; termograflar, barograflar ve higrograflar tarafından otomatik olarak çizilmiş sürekli eğrilerden oluşmakta ve sıcaklık, basınç, nem, rüzgar hızı, yağış gibi iklim değişkenlerini dakika dakika kayıt altına almaktadır. Bu proje, söz konusu analog arşivi dijital veri setine dönüştüren, dönüştürülen veriyi görselleştiren ve gelecek dönem iklim projeksiyonları üreten uçtan uca bir pipeline geliştirmeyi hedeflemektedir.

---

## Veri Kaynağı

Projede iki tür veri kullanılmaktadır:

### Analog TIF Taramaları
Kandilli Rasathanesi'nin 1911'den günümüze uzanan grafik kağıtlarının yüksek çözünürlüklü taramaları. Mevcut örnekler:

| Yıl | Tür | Açıklama |
|-----|-----|----------|
| 1918 | Sıcaklık, Basınç, Nem | Osmanlıca/Almanca etiketli haftalık termogram |
| 1942 | Yağış | Ekim ayı kümülatif yağış kaydı |
| 1985 | Yağış | Ekim ayı yağış kaydı |
| 1987 | Sıcaklık, Basınç, Rüzgar Hızı, Rüzgar Yönü | Mart ayı haftalık kayıtlar |
| 2001 | Aktinograf | Mayıs ayı güneş radyasyonu |
| 2010 | Nem | Mayıs ayı nem kaydı |

Her grafik kağıdı yapılandırılmış bir formata sahiptir:
- **X ekseni:** Zaman (saat bazında günler veya gün bazında aylar)
- **Y ekseni:** Ölçüm değeri (°C, hPa, %, m/s gibi)
- **Eğri:** Cihazın ibre ile kağıda çizdiği sürekli ölçüm kaydı

### Sayısallaştırılmış Veri (Referans)
Daha önce elle dönüştürülmüş ve doğrulama amacıyla kullanılan veri setleri:

- `Nem-1980-2014.xlsx` — Günlük nem değerleri (%), 1980–2014, 35 yıl
- `Basınç_Şubat_1984-2013.xls` — Şubat ayı günlük basınç değerleri, 1984–2013, 30 yıl

---

## Proje Mimarisi

Sistem üç ana bileşenden oluşmaktadır ve bu bileşenler hackathonun üç kategorisine karşılık gelmektedir.

### 1. CV Sayısallaştırma Pipeline'ı (Digitization)

Analog grafik kağıtlarından sayısal veri çıkarımı için geliştirilen bu pipeline aşağıdaki adımlardan oluşmaktadır:

**Izgara Tespiti ve Kalibrasyon**
OpenCV Hough Lines algoritması ile grafik kağıdındaki yatay ve dikey ızgara çizgileri tespit edilir. Tespit edilen ızgara, piksel koordinatlarını gerçek ölçüm değerlerine dönüştürmek için referans noktaları sağlar.

**Eğri İzolasyonu**
Renk ve kontrast analizine göre iki farklı yol izlenir: siyah mürekkep için adaptif eşikleme (adaptive thresholding), mavi/kırmızı mürekkep için HSV renk alanında maskeleme. Her iki durumda da morfolojik açma ve kapama işlemleriyle küçük gürültü noktaları temizlenir.

**Koordinat Okuma**
Her x sütunu için karanlık piksellerin medyanı alınarak eğrinin y konumu bulunur. Medyan kullanımı, ızgara çizgilerinin eğri tespitine olan etkisini minimize eder.

**Gerçek Değerlere Dönüşüm**
Piksel koordinatları, kullanıcının girdiği zaman aralığı ve Y ekseni sınırları kullanılarak doğrusal interpolasyonla gerçek değerlere çevrilir. Çıktı, zaman damgası ve ölçüm değeri içeren CSV dosyasıdır.

**Doğrulama**
Aynı dönemlere ait sayısallaştırılmış Excel verisiyle karşılaştırma yapılarak pipeline'ın doğruluğu ölçülür.

### 2. İnteraktif Dashboard (Visualization)

Streamlit üzerine inşa edilen web arayüzü şu özellikleri sunar:

**Canlı Sayısallaştırma Görünümü**
Kullanıcı bir TIF dosyası yüklediğinde sistem otomatik olarak işleme başlar. Orijinal grafik kağıdının üzerine tespit edilen eğri overlay olarak çizilir; böylece kullanıcı sonucun doğruluğunu görsel olarak doğrulayabilir.

**Çok Dönemli Karşılaştırma**
1918, 1942, 1987 ve 2010 gibi farklı dönemlere ait veriler aynı grafikte karşılaştırılabilir. Bu görünüm, onlarca yıl içinde iklim değişkenlerinin nasıl evrildiğini açıkça ortaya koymaktadır.

**Anomali Tespiti**
Yıllık ortalamadan istatistiksel olarak anlamlı biçimde sapan dönemler otomatik olarak işaretlenir. Bu özellik, ekstrem iklim olaylarının ve iklim değişikliği etkilerinin görselleştirilmesine katkı sağlar.

**Veri İndirme**
İşlenen herhangi bir grafik kağıdının verisi CSV formatında indirilebilir.

### 3. İklim Tahmin Modeli (Prediction)

Sayısallaştırılmış tarihsel veri üzerinden gelecek dönem projeksiyonları üretilmektedir.

**Trend Analizi**
1980–2014 nem ve 1984–2013 basınç verileri kullanılarak uzun vadeli iklim trendleri hesaplanmaktadır. Bu analizde Kandilli'nin İstanbul'daki iklim değişikliğinin izlerini taşıyıp taşımadığı incelenmektedir.

**Mevsimsellik Modelleme**
Prophet kütüphanesi ile yıllık ve haftalık mevsimsel döngüler modellenmektedir. Bu model, belirli bir günün tarihsel ortalamasını ve güven aralığını hesaplayabilmektedir.

**2025–2030 Projeksiyonu**
Tarihsel trendler ve mevsimsellik bileşenleri birleştirilerek önümüzdeki yıllara ait nem ve sıcaklık tahminleri üretilmektedir. Tahminler güven aralıklarıyla birlikte gösterilmektedir.

---

**Gerekli kütüphaneler:**
```
opencv-python
numpy
pandas
plotly
streamlit
prophet
openpyxl
xlrd
Pillow
```

---

## Klasör Yapısı

```
.
├── Graf Kağıtları Tarama/     # Verilecek Ham TIF taramaları
├── Sayısallaştırılmış Veri/   # Verilecek Referans Excel dosyaları
├── digitize.py                # CV sayısallaştırma pipeline'ı
├── predict.py                 # İklim tahmin modeli
├── app.py                     # Streamlit dashboard
├── requirements.txt
└── README.md
```

---


