
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 1. Sunucu sağlık kontrolü
    if (url.pathname === "/api/health") {
      return Response.json({
        worker: "active",
        groqConfigured: Boolean(env.GROQ_API_KEY)
      });
    }

    // 2. Senaryo oluşturma
    if (url.pathname === "/api/generate") {

      // Yalnızca POST isteği kabul edilir
      if (request.method !== "POST") {
        return Response.json(
          {
            success: false,
            error: "Yalnızca POST isteği kabul edilir."
          },
          { status: 405 }
        );
      }
      
      // API anahtarı kontrolü
      if (!env.GROQ_API_KEY) {
        return Response.json(
          {
            success: false,
            error: "Groq API anahtarı yapılandırılmamış."
          },
          { status: 500 }
        );
      }

      try {
        // Kullanıcıdan gelen veriler
        const body = await request.json();

        const topic = String(body.topic || "").trim();
        const language = String(body.language || "Turkish");
        const duration = Number(body.duration || 30);
        const details = String(body.details || "").trim();

        if (!topic) {
          return Response.json(
            {
              success: false,
              error: "Lütfen video konusunu yaz."
            },
            { status: 400 }
          );
        }

        if (![25, 30, 45, 60].includes(duration)) {
          return Response.json(
            {
              success: false,
              error: "Video süresi 25, 30, 45 veya 60 saniye olmalıdır."
            },
            { status: 400 }
          );
        }

        // Puffy için senaryo talimatları
        const prompt = `
Sen Little Explorers adlı çocuk eğitim kanalının senaryo yazarısın.

ANA KARAKTER:
Puffy adında sevimli bir 3D çizgi film karakteri.
- Krem/beyaz yumuşak tüylü vücut
- Büyük turkuaz gözler
- Şeftali tonlarında kulak içleri
- Küçük kahverengi burun
- Turkuaz sırt çantası ve üzerinde altın yıldız

Puffy'nin görünüşünü bütün sahnelerde aynı tut.

HEDEF KİTLE:
3-6 yaş arası çocuklar.

VİDEO BİLGİLERİ:
Konu: ${topic}
Dil: ${language}
Süre: ${duration} saniye
Ek bilgiler: ${details || "Ek bilgi yok."}

VİDEO KURALLARI:
- Dikey 9:16 YouTube Shorts formatı.
- Renkli, sevimli, kaliteli 3D animasyon.
- Basit, eğlenceli ve öğretici anlatım.
- Çocukların kolay anlayacağı kısa cümleler.
- İlk 3 saniyede dikkat çekici bir giriş.
- Puffy videonun ana karakteri olsun.
- Her sahne için görsel üretim talimatı yaz.
- Her sahne için kamera hareketi ve animasyon belirt.
- Seslendirme metni ve ses efektleri ekle.
- Türkçe ve İngilizce içerik hazırla.
- Video süresini sahnelere böl ve toplam süreyi aşma.

ÇIKTIYI ŞU DÜZENDE HAZIRLA:

1. VİDEO BAŞLIĞI
Türkçe ve İngilizce.

2. DİKKAT ÇEKİCİ GİRİŞ
İlk 1-3 saniyelik açılış.

3. SAHNE SAHNE SENARYO
Her sahnede şunlar bulunsun:
- Sahne numarası
- Başlangıç ve bitiş zamanı
- Görsel üretim promptu
- Puffy'nin hareketleri ve mimikleri
- Kamera hareketi
- Türkçe seslendirme
- İngilizce seslendirme
- Ekranda görünecek Türkçe ve İngilizce yazılar
- Ses ve efekt önerileri

4. KAPANIŞ
Çocuklara yönelik sevimli bir kapanış ve kısa etkileşim çağrısı.

5. YOUTUBE AÇIKLAMASI
Türkçe ve İngilizce.

6. ETİKETLER
YouTube Shorts için uygun etiketler.

7. KALİTE KONTROL
Puffy karakter tutarlılığı, yaşa uygunluk, bilgi doğruluğu ve toplam video süresini kontrol et.

Yalnızca senaryoyu üret. Açıklama veya senaryo dışı yorum ekleme.
`;

        // Groq API isteği
        const response = await fetch(
          "https://api.groq.com/openai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Authorization": "Bearer " + env.GROQ_API_KEY,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              model: "openai/gpt-oss-120b",
              messages: [
                {
                  role: "system",
                  content: "Sen profesyonel bir çocuk eğitici video senaristisin."
                },
                {
                  role: "user",
                  content: prompt
                }
              ],
              temperature: 0.7,
              max_tokens: 3500
            })
          }
        );

        // Groq yanıtını oku
        const responseText = await response.text();

        let result;

        try {
          result = JSON.parse(responseText);
        } catch {
          return Response.json(
            {
              success: false,
              error: "Groq geçerli bir JSON yanıtı döndürmedi."
            },
            { status: 502 }
          );
        }

        // API hata kontrolü
        if (!response.ok) {
          const groqError =
            result.error?.message || "Bilinmeyen Groq API hatası.";

          return Response.json(
            {
              success: false,
              error: "Groq API hatası: " + groqError
            },
            { status: 502 }
          );
        }

        // Senaryo metnini al
        const script =
          result.choices?.[0]?.message?.content;

        if (!script) {
          return Response.json(
            {
              success: false,
              error: "AI boş yanıt döndürdü."
            },
            { status: 502 }
          );
        }

        // Başarılı yanıt
        return Response.json({
          success: true,
          script: script
        });

      } catch (error) {
        return Response.json(
          {
            success: false,
            error: "İstek işlenemedi: " + error.message
          },
          { status: 400 }
        );
      }
    }

    // 3. Diğer istekleri web paneline yönlendir
    return env.ASSETS.fetch(request);
  }
};
