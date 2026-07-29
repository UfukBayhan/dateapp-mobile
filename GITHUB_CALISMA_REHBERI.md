# HURMA GitHub Çalışma Rehberi

Bu belge Murat ve Ufuk'un GitHub üzerinde güvenli ve anlaşılır biçimde birlikte
çalışması için hazırlanmıştır. Bilmediğiniz bir adımı tahmin ederek uygulamayın;
önce bu rehbere bakın veya Codex'e sorun.

## Temel kavramlar

- **Repository (depo):** Projenin GitHub'daki klasörüdür. HURMA'nın mobil ve
  backend kodları iki ayrı depodadır.
- **Branch (dal):** Ana kodu bozmadan çalışma yapılan ayrı alandır.
- **Commit:** Yapılan değişikliklerin açıklamalı kayıt noktasıdır.
- **Push:** Yerel commitleri GitHub'a gönderir.
- **Pull Request (PR):** Bir daldaki değişiklikleri başka bir dala eklemek için
  açılan inceleme talebidir.
- **Review:** Diğer ekip üyesinin değişiklikleri incelemesidir.
- **Approve:** İnceleyen kişinin değişiklikleri uygun bulduğunu belirtmesidir.
- **Merge:** Onaylanan PR'ın hedef dala eklenmesidir.
- **CI / Checks:** Test, lint ve TypeScript kontrollerinin GitHub tarafından
  otomatik çalıştırılmasıdır.

PR numarası kişinin görev kimliği değildir. Numara, ilgili deponun Pull Request
sırasıdır. Bu nedenle her zaman **Mobil PR #3** veya **Backend PR #4** şeklinde
depo adıyla birlikte yazılmalıdır.

## Ekipte roller

Roller kişiye kalıcı olarak bağlı değildir; PR'ı kimin açtığına göre değişir.

### PR'ı Murat açtıysa

- Murat: PR sahibi ve değişikliğin sorumlusudur.
- Ufuk: Değişikliği inceler, soru sorar ve uygunsa onaylar.
- Murat kendi PR'ını onaylamaz.

### PR'ı Ufuk açtıysa

- Ufuk: PR sahibi ve değişikliğin sorumlusudur.
- Murat: Değişikliği inceler, soru sorar ve uygunsa onaylar.
- Ufuk kendi PR'ını onaylamaz.

Codex kod yazabilir, test edebilir, commit/push yapabilir ve PR hazırlayabilir;
ancak ürün kararları ve insan onayı Murat ile Ufuk'a aittir.

### Şu anki sorumluluklar

| Kişi / sistem | Şu anki sorumluluğu |
| --- | --- |
| Murat | Açık PR'ların sahibi; yorumları değerlendirir, düzeltmeleri hazırlar ve kontrollü merge/deploy sürecini yönetir. |
| Ufuk | Reviewer ve mobil kabul testçisi; değişiklikleri anlamaya çalışır, soru sorar, onaylar veya değişiklik ister. |
| Codex | Kodu hazırlar/inceler, testleri çalıştırır ve her işlemi öğretici notla açıklar. |
| GitHub Actions | Backend testleri ile mobil lint/TypeScript kontrollerini otomatik çalıştırır. |

## Şu anki GitHub durumu

29 Temmuz 2026 tarihinde giriş yapılmış GitHub oturumundan doğrulanan durum:

- Mobil PR #1, #2 ve #3 birleştirilmiştir.
- Mobil PR #4, parolasız SMS doğrulama ve klavye düzeltmeleri için açıktır.
- Backend PR #1–#5 açıktır.
- Backend PR #4 parola/JWT güvenliği, Backend PR #5 ise parolasız SMS kodu
  akışıyla ilgilidir. Aynı kimlik doğrulama alanını etkiledikleri için hangisinin
  esas alınacağı ve merge sırası Murat tarafından açıkça kararlaştırılmadan bu
  PR'lar birleştirilmez.
- Docker hazırlığı Backend PR #3 olarak açıktır fakat canlı sistemde şu an
  kullanılmamaktadır.

## PR durum tablosu

Bu tablo her review, yeni commit, merge veya deployment sonrasında
güncellenmelidir. `Doğrulanacak` yazan hücreler GitHub PR sayfasından kontrol
edilmeden tamamlanmış kabul edilmez.

| PR | Konu | Sahibi | Reviewer | Hedef | Checks | İnsan onayı | Durum / sonraki adım |
| --- | --- | --- | --- | --- | --- | --- | --- |
| [Mobil PR #1](https://github.com/MM-HAZNECI/dateapp-mobile/pull/1) | Mobil çalışma kontrolleri ve iOS build ayarı | Murat | Ufuk | `main` | Tamamlandı | Verildi | **Merge edildi.** |
| [Mobil PR #2](https://github.com/MM-HAZNECI/dateapp-mobile/pull/2) | Merkezi API adresi | Murat | Ufuk | `main` | Tamamlandı | Verildi | **Merge edildi.** |
| [Mobil PR #3](https://github.com/MM-HAZNECI/dateapp-mobile/pull/3) | Güvenli telefon ve parola girişi | Murat | Ufuk | `main` | Tamamlandı | Verildi | **Merge edildi.** |
| [Mobil PR #4](https://github.com/MM-HAZNECI/dateapp-mobile/pull/4) | Parolasız SMS doğrulama ve klavye düzeltmesi | Murat | Ufuk | Doğrulanacak | Doğrulanacak | Bekleniyor | Açık; backend auth kararıyla birlikte incelenecek. |
| [Backend PR #1](https://github.com/MM-HAZNECI/dateapp-backend/pull/1) | Sohbet turu bitiş olayını tekilleştirme | Murat | Ufuk | Doğrulanacak | Doğrulanacak | Bekleniyor | Açık; bağımsız düzeltme olarak incelenecek. |
| [Backend PR #2](https://github.com/MM-HAZNECI/dateapp-backend/pull/2) | Sürpriz eşleşme düzeltmesi | Murat | Ufuk | Doğrulanacak | Doğrulanacak | Bekleniyor | Açık; bağımsız düzeltme olarak incelenecek. |
| [Backend PR #3](https://github.com/MM-HAZNECI/dateapp-backend/pull/3) | Docker geliştirme ortamı | Murat | Ufuk | Doğrulanacak | Doğrulanacak | Bekleniyor | Açık; production ihtiyacı olmadığı için önceliği ayrıca kararlaştırılacak. |
| [Backend PR #4](https://github.com/MM-HAZNECI/dateapp-backend/pull/4) | Parola, JWT ve Socket.IO güvenliği | Murat | Ufuk | Doğrulanacak | Doğrulanacak | Bekleniyor | Açık; Backend PR #5 ile auth stratejisi netleştirilecek. |
| [Backend PR #5](https://github.com/MM-HAZNECI/dateapp-backend/pull/5) | Güvenli SMS kodu ile parolasız giriş | Murat | Belirlenecek | Doğrulanacak | Doğrulanacak | Bekleniyor | Açık; Mobil PR #4 ile birlikte staging'de test edilecek. |

Kullanılabilecek kısa durum ifadeleri:

- `Bekleniyor`: Henüz review veya kontrol sonucu yok.
- `İnceleniyor`: Reviewer dosyaları kontrol ediyor.
- `Değişiklik istendi`: Yorum veya Request changes var.
- `Checks başarısız`: Otomatik kontrollerden en az biri kırmızı.
- `Onaylandı`: İnsan onayı var; bu tek başına merge edildiği anlamına gelmez.
- `Merge edildi`: Değişiklik hedef dala eklendi.
- `Staging'de`: Test ortamına kuruldu.
- `Production'da`: Canlı ortama kontrollü biçimde kuruldu.

## Ufuk bir PR'ı nasıl inceler?

1. PR bağlantısını açar.
2. `Conversation` bölümünde değişikliğin amacını okur.
3. `Files changed` sekmesine girer.
4. Değişiklikleri dosya dosya okur; anlamadığı satıra `+` ile yorum bırakabilir.
5. `Checks` bölümünün yeşil olduğunu doğrular.
6. Sağ üstte `Review changes` düğmesine basar.
7. Uygunsa `Approve`, ardından `Submit review` seçer.
8. Sorun varsa `Request changes` seçer ve nedenini yazar.

Onay vermek kodu otomatik olarak canlıya almaz. Merge ve deployment ayrıca,
kontrollü sırayla yapılır.

## Murat bir review geldikten sonra ne yapar?

1. Ufuk'un yorumlarını okur.
2. Gerekirse Codex ile düzeltme yapar.
3. Yeni commit gönderilirse Ufuk tekrar inceler.
4. Tüm kontroller yeşil ve onay hazır olduğunda merge sırası planlanır.
5. Mobil ve backend sözleşmesi birlikte test edilmeden production deployment
   yapılmaz.

## Zincirleme mobil PR'lardan öğrenilen kural

Mobil PR #1, #2 ve #3 sırayla birleştirilmiştir. Gelecekte birbirinin üzerine
kurulan PR'larda şu sıra izlenir:

1. PR #1 incelenir ve birleştirilir.
2. PR #2'nin hedefi `main` yapılır veya dal güncel `main` üzerine taşınır.
3. PR #2'de yalnızca kendi değişikliklerinin kaldığı doğrulanır; CI ve review
   yeniden yapılır.
4. PR #2 birleştirildikten sonra aynı işlem PR #3 için tekrarlanır.

Hedef dal değişikliği eski yorumları ve onayları geçersiz hâle getirebilir.
Değişiklikten sonra `Files changed`, `Checks` ve reviewer durumu yeniden kontrol
edilmelidir. Merge yöntemine Murat ile Codex birlikte karar vermelidir; Ufuk bu
işlem için tahminle Git komutu çalıştırmamalıdır.

## Staging ve production sırası

Yeni mobil kimlik doğrulaması ile yeni backend birbirine bağlıdır. Biri eski,
diğeri yeni sürümken giriş akışı bozulabilir. Bu nedenle önerilen sıra şöyledir:

1. Hangi auth yaklaşımının esas olduğu kararlaştırılır: parola/JWT (Backend PR
   #4) veya parolasız SMS (Backend PR #5 + Mobil PR #4).
2. Seçilen backend dalı ayrı Render staging servisine kurulur.
3. Staging backend ayrı Neon test veritabanı/branch kullanır.
4. Mobil preview build staging API adresiyle hazırlanır.
5. Gerçek cihaz + emulator üzerinde iki kullanıcılı uçtan uca test yapılır.
6. Migration ve geri dönüş adımları doğrulanır.
7. Testler başarılıysa production geçiş planı ayrıca onaylanır.

Gerçek kullanıcı varsa eski ve yeni mobil sürümlerin geçiş süresi ayrıca
planlanmalıdır. Yeni backend eski mobil istemcileri desteklemiyorsa zorunlu
güncelleme veya kontrollü bakım aralığı olmadan deployment yapılmaz.

## Her işlemde kullanılacak açıklama notu

Codex'ten veya işlemi yapan ekip üyesinden her önemli adımda aşağıdaki formatta
not istenir:

```text
Tarih / saat:
İlgili depo ve PR:

Ne yapıyoruz?

Neden yapıyoruz?

Kim yapacak?

GitHub'da veya bilgisayarda nereye gidilecek?

Beklenen sonuç nedir?

Risk nedir?

Sorun olursa nasıl geri döneriz?

İşlem sonrası gerçek sonuç:

Sonraki adım ve sorumlusu:
```

### Not formatı nasıl kullanılır?

1. İşleme başlamadan önce ilk sekiz alan doldurulur. Böylece neye izin
   verildiği ve beklenen sonuç baştan nettir.
2. Parola, token, `.env`, Neon bağlantısı veya başka bir secret nota yazılmaz.
3. İşlem bittikten sonra `İşlem sonrası gerçek sonuç` alanına görülen sonuç
   yazılır. Tahmin değil, GitHub/terminalde doğrulanan sonuç kaydedilir.
4. Bir hata varsa gizlenmez; hata mesajının hassas bilgi içermeyen özeti ve
   geri dönüş işlemi yazılır.
5. `Sonraki adım ve sorumlusu` boş bırakılmaz. Böylece Murat mı, Ufuk mu yoksa
   Codex mi devam edecek açık olur.
6. Kısa işlemlerde cevaplar birer cümle olabilir. Merge, migration ve deploy
   gibi riskli işlemlerde daha ayrıntılı yazılır.

### Doldurulmuş örnek

```text
Tarih / saat: 29 Temmuz 2026, 16:00
İlgili depo ve PR: Mobil depo, PR #1

Ne yapıyoruz?
PR #1'in otomatik kontrollerini ve değişen dosyalarını inceliyoruz.

Neden yapıyoruz?
Hatalı kodun main dalına girmesini önlemek ve değişikliği öğrenmek için.

Kim yapacak?
Ufuk inceleyecek; anlamadığı kodu Codex açıklayacak. Murat sonucu bekleyecek.

GitHub'da veya bilgisayarda nereye gidilecek?
Mobil PR #1 → Checks → Files changed → Review changes.

Beklenen sonuç nedir?
Checks yeşil olacak; anlaşılmayan yorum kalmayacak; uygunsa Approve verilecek.

Risk nedir?
Değişiklik tam anlaşılmadan onaylanırsa hatalı davranış main dalına girebilir.

Sorun olursa nasıl geri döneriz?
Approve vermeyiz; Comment veya Request changes ile düzeltme isteriz.

İşlem sonrası gerçek sonuç:
Bu alan review tamamlandıktan sonra doldurulur.

Sonraki adım ve sorumlusu:
Onay ve yeşil kontroller sonrası merge kararını Murat verecek.
```

Bu notlar PR açıklamasına, PR yorumuna veya ekip çalışma günlüğüne yazılabilir.
Hangi yere yazılırsa yazılsın aynı işlem için tek bir güncel kayıt tutulmalıdır.

## HURMA'nın mevcut teknik yapısı

- Mobil uygulama: Expo / React Native
- Backend: FastAPI, Render üzerinde çalışıyor
- PostgreSQL: Neon kullanılıyor
- Docker: Şu anda canlıda kullanılmıyor; ayrı geliştirme dalında hazırlık var
- GitHub Actions: Backend testleri ile mobil lint/TypeScript kontrollerini
  çalıştırıyor

## Güvenlik kuralları

- Parola, Neon bağlantı adresi, JWT, Render anahtarı ve `.env` içeriği GitHub'a
  yazılmaz.
- Bir secret daha önce yanlışlıkla Git geçmişine girdiyse yalnızca dosyadan
  silinmesi yeterli değildir; ilgili secret yenilenir.
- `main` dalına doğrudan push yapılmaz; değişiklik PR ile gelir.
- PR sahibi kendi değişikliğini onaylamaz.
- Otomatik kontroller başarısızsa merge yapılmaz.
- Canlı deployment öncesinde veritabanı migration ve geri dönüş planı
  hazırlanır.

## Standart çalışma sırası

1. Yapılacak iş açıklanır ve standart işlem notu başlatılır.
2. Yeni branch açılır.
3. Kod yazılır ve yerelde test edilir.
4. Commit ve push yapılır.
5. PR açılır.
6. Diğer ekip üyesi review/approve yapar.
7. Kontroller yeşilse PR merge edilir.
8. Uygun ortamda deployment yapılır.
9. Canlı smoke test yapılır.
10. PR durum tablosu ve işlem notu gerçek sonuçla güncellenir.
