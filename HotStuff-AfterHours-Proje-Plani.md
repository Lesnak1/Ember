# HotStuff Builder Program — "AfterHours" dApp Proje Planı

> **Amaç:** HotStuff Builder Program'a başvurmak için sıfırdan kurulacak; builder (broker) kodları üzerinden on-chain gelir üreten; non-custodial (kullanıcı fonlarına asla dokunmayan) bir **otomatik trading & yatırım terminali**. Bu dokümanı bir AI agent / IDE'ye kopyala-yapıştır yaparak proje kurulumunu yapabilirsin. En sonda hazır bir **Master Build Prompt** vardır.
>
> **Doküman sürümü:** v1.0 · **Hazırlanma tarihi:** 24 Haziran 2026

---

## İçindekiler

1. Yönetici Özeti (Thesis)
2. HotStuff Ekosistem Analizi
3. Builder Program — Para Modeli (Monetization Mechanics)
4. Ürün Konsepti ve Değerlendirilen Alternatifler
5. Özellik Kırılımı (Modüller)
6. Teknik Mimari
7. Teknoloji Stack'i
8. HotStuff API Entegrasyon Spesifikasyonu
9. Veri Modeli
10. Non-Custodial Güvenlik & Risk Modeli
11. Aşamalı Yol Haritası (MVP → V1 → V2)
12. Repo / Dosya Yapısı (Scaffold)
13. Ortam Değişkenleri (Env) & Konfigürasyon
14. Testnet → Mainnet Lansman Planı
15. Builder Program Başvuru & Puan Stratejisi
16. KPI'lar ve Başarı Metrikleri
17. Açık Kararlar / Sorular
18. EK A — Master Build Prompt (kopyala-yapıştır)
19. EK B — Kaynaklar

---

## 1. Yönetici Özeti (Thesis)

HotStuff, **DracoBFT** konsensüsü üzerinde çalışan, ~200k TPS / 75ms blok süresi / 150ms finality sunan, DeFi-native bir **Layer-1** zincirdir. İlk dApp'i olan **Perp DEX**, tek bir teminat (margin) hesabıyla **7/24 açık** olan kripto perp'leri, tokenize ABD hisselerini/ETF'leri, RWA'ları, FX ve emtiaları **50x'e kadar kaldıraçla** sunar. Slogan: *"Trade. Invest. Bank. Open while Wall Street sleeps."*

**Builder Program**, geliştiricilerin kullanıcılar adına gönderdikleri emirlerden **trading fee'lerinin bir kısmını on-chain olarak** almasını sağlar (builder/broker kodları). Ek olarak ekosisteme anlamlı katkı sağlayan ekiplere ayrılmış **2.000.000 puanlık** bir ödül havuzu vardır.

### Stratejik içgörü

Builder Program'da kazanmanın yolu **sürekli ve organik trading hacmi üretmek**. Dolayısıyla tek seferlik bir araç değil; kullanıcıyı elde tutan (retention), 7/24 açık piyasalarda kendi kendine emir akışı (order flow) üreten bir ürün gerekir. En yüksek kaldıraç noktası **otomasyon**dur: botlar, DCA/otomatik yatırım, copy-trade ve akıllı emir yürütme — bunların hepsi uyku saatlerinde bile hacim üretir.

### Önerilen ürün: "AfterHours"

HotStuff üzerinde çalışan, **non-custodial**, otomatik strateji + akıllı emir-yürütme (smart execution) terminali. Marka konumlandırması doğrudan HotStuff'ın "Wall Street uyurken çalışır" temasıyla örtüşür: **kullanıcı uyurken bile stratejileri çalışmaya devam eder.**

Neden kazanır:

- **Builder fee uyumu:** Otomasyon = sürekli emir akışı = sürekli builder fee. Her child-order'a builder kodu eklenir.
- **Özgünlük:** HotStuff'ın benzersiz "tek hesapta 7/24 tokenize hisse + kripto + RWA" yapısını kullanan bir robo-advisor + algo-execution katmanı henüz yok.
- **Uzun vadeli fayda:** Ekibe (hacim + retention + ekosistem derinliği) ve kullanıcılara (daha iyi fiyat, otomasyon, risk yönetimi) sürekli değer üretir.
- **Maker-rebate avantajı:** Maker-first yürütme ile kullanıcı maker rebate kazanırken builder fee'yi büyük ölçüde absorbe eder — net maliyet rakiplere göre düşük.

---

## 2. HotStuff Ekosistem Analizi

| Konu | Bulgu |
|---|---|
| Zincir | DeFi-native L1, **DracoBFT** konsensüsü (pipelined 2-round BFT), CLH commitment, Engine-API uyumu, SP1/zkTLS proof ingestion |
| Performans | ~200k TPS, 75ms blok, 150ms finality |
| Mimari özgünlük | Validator'lar "son kilometre" finans geçidi (Uber-style routing): trading + ödeme + fiat rails |
| İlk dApp | HotStuff Perp DEX — on-chain order book |
| Varlık sınıfları | Kripto perp, tokenize ABD hisseleri & ETF (xStocks + Alpaca, 1:1 backed), RWA, FX & endeksler, emtia |
| Piyasa | 22+ market, 7/24 erişim, 50x'e kadar kaldıraç (BTC/ETH 50x, SOL 25x, vb.) |
| Vizyon | "Trade / Invest / Bank" — neobank + 7/24 spot tokenize hisse + perp |
| Topluluk/durum | Public testnet (Aralık 2025), Points Program (Şub 2026), olası airdrop |

**Çıkarım:** "7/24 tokenize hisse + tek margin hesabı" kombinasyonu rakiplerde (Hyperliquid vb.) yok. Bu, **TradFi tarzı otomatik yatırım** (recurring/DCA, rebalancing) ile **kripto-native otomasyonu** (grid, funding harvest, copy-trade) aynı üründe birleştirmek için eşsiz bir fırsat.

---

## 3. Builder Program — Para Modeli (Monetization Mechanics)

Builder kodları (API'de "broker codes") emir bazında atanır; kullanıcı adına gönderilen fill'lerden builder fee alınır. **Tüm builder mantığı on-chain fee mekanizmasında işlenir.**

### Akış (kritik kurallar)

1. **Kullanıcı onayı (bir kez):** Kullanıcı, builder adresi için maksimum bir fee'yi `approveBrokerFee` ile onaylar. **Bu onay ana cüzdanla (agent/API cüzdanı değil) imzalanmalıdır.** İstediği zaman iptal edilebilir.
2. **Builder uygunluğu:** Builder, fee toplayabilmek için perps hesabında **en az 100 USDC** değer bulundurmalıdır.
3. **Üst limit:** Perp'lerde builder fee **en fazla %1**.
4. **Emir bazında fee:** `placeOrder` aksiyonlarına opsiyonel `brokerConfig: { broker, fee }` eklenir. `fee` ondalık kesir olarak verilir — örn. `"0.0005"` = %0.05 = 5 bps. `fee`, kullanıcının onayladığı `maxFeeRate`'ten **küçük** olmalıdır.
5. **Onay kontrolü:** `brokers_check` (info) ile kullanıcının onay kayıtları ve `max_fee_rate` doğrulanır.
6. **Talep (claim):** Biriken builder fee'ler `claimReferralRewards` ile (UI'daki referral dashboard veya API) spot ya da türev teminat bakiyesine çekilir.

### Gelir modeli (örnek)

- Kullanıcı onayı: `maxFeeRate = 0.001` (%0.1).
- Uygulama her emirde `brokerConfig.fee = 0.0003` (%0.03 = 3 bps) uygular.
- Aylık yönlendirilen hacim 50.000.000 USD ise → builder geliri ≈ 50.000.000 × 0.0003 = **15.000 USD/ay**.
- Buna ek olarak Builder Program puanları (2M havuz) ve potansiyel airdrop üst-değeri.

> **Tasarım notu:** Builder fee kullanıcı maliyetine eklenir. Maker-first yürütme (post-only) ile kullanıcı **maker rebate** (örn. -%0.002 ve üzeri) kazanır; bu, builder fee'yi kısmen/tamamen dengeler. Ürünü "pahalı" göstermeden gelir üretmenin anahtarı budur.

---

## 4. Ürün Konsepti ve Değerlendirilen Alternatifler

Uzman bakışıyla 5 fikir değerlendirildi (1–5 ölçek; yüksek = iyi):

| Fikir | Builder fee uyumu | Özgünlük | Retention | Teknik fizibilite | Toplam |
|---|---|---|---|---|---|
| **AfterHours — Otomasyon + Smart Execution** | 5 | 5 | 5 | 4 | **19** |
| Copy / Social trading | 5 | 4 | 4 | 3 | 16 |
| Yapılandırılmış ürün / yield vault | 4 | 4 | 4 | 3 | 15 |
| Birleşik portföy & risk dashboard'u | 2 | 3 | 4 | 5 | 14 |
| AI trading copilot (sohbet) | 3 | 4 | 3 | 3 | 13 |

**Karar:** Flagship olarak **AfterHours** seçildi. Copy-trading ve yield vault, AfterHours'un üzerine **Faz 2–3 modülleri** olarak inşa edilebilir (aynı execution + builder-code altyapısını paylaşır).

### Ürün tek cümlede

> *AfterHours: HotStuff'ın 7/24 piyasalarında çalışan, fonlarını asla emanet almayan, otomatik strateji botları + kurumsal-seviye akıllı emir yürütme sunan ve her işlemde builder koduyla gelir üreten bir trading/yatırım terminali.*

---

## 5. Özellik Kırılımı (Modüller)

### 5.1 Smart Execution Engine (çekirdek)
- **TWAP / VWAP / Iceberg**: büyük emirleri zamana/parçaya bölerek slippage azaltma.
- **Limit-ladder (scaled orders)**: fiyat aralığına kademeli emir dağıtımı.
- **Maker-first routing**: mümkün olduğunda `po` (post-only) ile maker rebate hedefleme; gerekirse IOC/market fallback.
- **Trigger / sniper emirleri**: oracle/mark fiyatına göre koşullu tetikleme.
- Her child-order'a `brokerConfig` (builder kodu) otomatik eklenir.

### 5.2 Strateji Otomasyonu ("Autopilots")
- **DCA / Recurring Invest**: tokenize hisse/ETF/kripto'ya periyodik alım (robo-advisor; 7/24 piyasanın asıl kozu).
- **Grid Bot**: yatay piyasalarda al-sat ızgarası.
- **Funding-rate Harvest / Delta-Neutral (basis)**: pozitif funding'i toplamak için nötr pozisyon.
- **Portföy Rebalancing**: hedef ağırlıklara göre tek margin hesabında otomatik dengeleme.
- **Gelişmiş SL/TP & Trailing Stop**: native temel TP/SL üzerine trailing ve çok kademeli çıkış.

### 5.3 Copy / Social Katmanı (Faz 2)
- Lider trader / strateji vault'larını takip et; agent cüzdan ile mirror.
- Lider için performans paneli, takipçi için risk limitleri.

### 5.4 Birleşik Portföy & Risk
- Cross-asset PnL, ödenen/kazanılan funding, likidasyon mesafesi, margin sağlığı.
- WebSocket ile gerçek-zamanlı fill/pozisyon/fiyat ve uyarılar (alerts).

### 5.5 Builder/Referral Konsolu
- Onay (approve broker fee) sihirbazı, `brokers_check` doğrulaması.
- Birikmiş builder fee görünümü ve `claimReferralRewards` ile çekim.

---

## 6. Teknik Mimari

```
┌──────────────────────────────────────────────────────────────┐
│                        Frontend (Web dApp)                     │
│  Next.js + wagmi/viem · Cüzdan bağlama, approveBrokerFee,      │
│  addAgent imzaları, strateji kurulumu, portföy/risk panelleri  │
└───────────────┬───────────────────────────┬──────────────────┘
                │ REST/WSS (read)           │ imzalı aksiyonlar
                ▼                           ▼
┌──────────────────────────────┐  ┌──────────────────────────────┐
│      Backend API (NestJS)     │  │   Strategy/Execution Engine    │
│  Auth (SIWE), strateji CRUD,  │  │  Agent cüzdanla EIP-712 imza,  │
│  builder konsol, webhooks     │  │  TWAP/grid/DCA scheduler,      │
│                               │  │  brokerConfig enjeksiyonu      │
└───────────────┬──────────────┘  └───────────────┬──────────────┘
                │                                  │
        ┌───────▼───────┐                  ┌───────▼────────┐
        │  PostgreSQL    │                  │ Redis + BullMQ │
        │ (kullanıcı,    │                  │ (job queue,    │
        │  strateji,     │                  │  rate-limit,   │
        │  fill, audit)  │                  │  nonce cache)  │
        └────────────────┘                  └───────┬────────┘
                                                     │
                                          ┌──────────▼───────────┐
                                          │   HotStuff L1 API      │
                                          │  REST /exchange /info  │
                                          │  /explorer · WSS /ws   │
                                          └────────────────────────┘
```

**Anahtar prensipler**
- **Non-custodial:** Kullanıcı ana cüzdanı asla backend'e gelmez. Kullanıcı yalnızca (1) `approveBrokerFee` ve (2) `addAgent` imzalar. Botlar **scoped agent cüzdanı** ile imza atar; agent `validUntil` ile süreli ve `revokeAgent` ile iptal edilebilir.
- **Deterministik yürütme:** Tüm strateji adımları idempotent job'lar; nonce yönetimi merkezi.
- **Gerçek-zamanlılık:** WSS abonelikleri ile fill/pozisyon push; REST yalnızca fallback/initial-load.

---

## 7. Teknoloji Stack'i

| Katman | Seçim | Gerekçe |
|---|---|---|
| Frontend | **Next.js 14 (App Router) + TypeScript**, Tailwind + shadcn/ui, TanStack Query, Zustand | Hızlı, modern, SSR + iyi DX |
| Cüzdan | **wagmi + viem**, RainbowKit/ConnectKit; EIP-712 imza | EVM imza standardı, HotStuff EIP-712 uyumlu |
| Backend | **NestJS (Node 20+, TS)** | Modüler, kuyruk/scheduler entegrasyonu kolay |
| Execution | **HotStuff TypeScript SDK** (`hotstuff-labs/ts-sdk`) | İmza/MessagePack hatalarını önler (resmî öneri) |
| DB | **PostgreSQL + Prisma** | İlişkisel, audit/strateji için ideal |
| Queue/Cache | **Redis + BullMQ** | Zamanlı job, retry, rate-limit |
| Realtime | HotStuff **WSS** + sunucu→istemci **SSE/WS** | Düşük gecikme |
| Gözlemlenebilirlik | OpenTelemetry + Grafana/Loki, Sentry | İşlem güvenilirliği |
| Deploy | Docker + (Railway/Fly.io/AWS), Vercel (frontend) | Hızlı CI/CD |
| Test | Vitest/Jest, Playwright (e2e), testnet entegrasyon testleri | Güven |

> **Not:** Resmî SDK'lar Python ve TypeScript için mevcut (Go/Rust yakında). İmzaları elle üretmek yerine **SDK kullanımı şiddetle önerilir** (dokümanda da belirtiliyor).

---

## 8. HotStuff API Entegrasyon Spesifikasyonu

### 8.1 Endpoint'ler

| Ortam | REST | WSS |
|---|---|---|
| Mainnet | `https://api.hotstuff.trade` | `wss://api.hotstuff.trade/ws` |
| Testnet | `https://testnet-api.hotstuff.trade` | `wss://testnet-api.hotstuff.trade/ws` |

Yollar: `POST /exchange` (imzalı aksiyonlar), `POST /info` (okuma), `POST /explorer` (blok/işlem).

### 8.2 İmzalama (EIP-712 + MessagePack)

Tüm exchange aksiyonları EIP-712 typed-data ile imzalanır:

1. Aksiyon payload'u **MessagePack** ile encode edilir.
2. Encode edilen byte'lar **keccak256** ile hash'lenir.
3. Hash, aşağıdaki yapıyla EIP-712 olarak imzalanır.

```typescript
const domain = {
  name: "HotstuffCore",
  version: "1",
  chainId: 1,
  verifyingContract: "0x1234567890123456789012345678901234567890", // resmî adresi kullan
};

const types = {
  Action: [
    { name: "source", type: "string" }, // "Testnet" | "Mainnet"
    { name: "hash",   type: "bytes32" }, // keccak256(msgpack(action))
    { name: "txType", type: "uint16" },  // op kodu
  ],
};

const message = {
  source: isTestnet ? "Testnet" : "Mainnet",
  hash: keccak256(encode(action)),
  txType, // ör. 1301
};
```

### 8.3 Aksiyon Op Kodları (txType)

| Aksiyon | type | Op kodu |
|---|---|---|
| Add Agent | `addAgent` | 1201 |
| Revoke Agent | `revokeAgent` | 1211 |
| Update Perp Leverage | `updatePerpLeverage` | 1203 |
| Approve Broker Fee | `approveBrokerFee` | 1207 |
| Create Referral Code | `createReferralCode` | 1208 |
| Set Referrer | `setReferrer` | 1209 |
| Claim Referral Rewards | `claimReferralRewards` | 1210 |
| Place Order | `placeOrder` | 1301 |
| Cancel by OID | `cancelByOid` | 1302 |
| Cancel All | `cancelAll` | 1311 |
| Cancel by Cloid | `cancelByCloid` | 1312 |
| Cancel by Instrument | `cancelByInstrument` | 1313 |
| Spot Withdraw | `spotWithdrawRequest` | 1002 |
| Derivative Withdraw | `derivativeWithdrawRequest` | 1003 |
| Spot Balance Transfer | `spotBalanceTransferRequest` | 1051 |
| Derivative Balance Transfer | `derivativeBalanceTransferRequest` | 1052 |
| Internal Balance Transfer | `internalBalanceTransferRequest` | 1053 |
| Deposit to Vault | (type `"1401"`) | 1401 |

### 8.4 Builder Akışı — uçtan uca

**(a) Approve Broker Fee (ana cüzdan imzalar, op 1207)**
```json
{
  "action": {
    "data": { "broker": "0xBUILDER...", "maxFeeRate": "0.001", "nonce": 1769690420567 },
    "type": "approveBrokerFee"
  },
  "signature": "0x...",
  "nonce": 1769690420567
}
```

**(b) Onay kontrolü — `brokers_check` (POST /info)**
```json
{ "method": "brokers_check", "params": { "user": "0xUSER...", "broker": "0xBUILDER..." } }
```
Yanıt: `data[].max_fee_rate`, `account`, `broker`, `updated_at`.

**(c) Place Order + brokerConfig (op 1301)**
```json
{
  "action": {
    "data": {
      "orders": [{
        "instrumentId": 1, "side": "b", "positionSide": "BOTH",
        "price": "92291", "size": "0.00597", "tif": "IOC",
        "ro": false, "po": false, "cloid": "<hex>", "triggerPx": "",
        "isMarket": true, "tpsl": "", "grouping": ""
      }],
      "brokerConfig": { "broker": "0xBUILDER...", "fee": "0.0003" },
      "expiresAfter": 1769690725903,
      "nonce": 1769687125903
    },
    "type": "placeOrder"
  },
  "signature": "0x...",
  "nonce": 1769687125903
}
```
> `fee` ondalık kesir: `0.0003` = %0.03 = 3 bps; `maxFeeRate`'ten küçük olmalı.

**(d) Claim — `claimReferralRewards` (op 1210)**
```json
{
  "action": {
    "data": { "collateralId": 1, "spot": false, "nonce": 1769690421578 },
    "type": "claimReferralRewards"
  },
  "signature": "0x...",
  "nonce": 1769690421578
}
```

### 8.5 Agent (API) Cüzdanı — `addAgent` (op 1201)
Uygulama, kullanıcı adına imza atabilen süreli bir agent cüzdanı kaydeder. `data`: `agentName`, `agent` (adres), `forAccount`, `signature`, `validUntil` (unix), `nonce`. İptal: `revokeAgent` (1211).

> **Önemli:** `approveBrokerFee` ana cüzdanla imzalanır; trading aksiyonları agent cüzdanıyla imzalanabilir. Bu, non-custodial mimarinin temelidir.

### 8.6 Order semantiği
- **Order tipleri:** Limit, Market. (Ek tipler yolda.)
- **TIF:** `GTC`, `IOC`, `FOK`. **Flags:** `po` (post-only/maker), `ro` (reduce-only).
- **TP/SL:** açık pozisyona bağlı, varsayılan reduce-only; `triggerPx` ile limit/market.
- **Hedge/one-way:** `positionSide` = `BOTH` | `LONG` | `SHORT`. **grouping:** `position` | `normal` | `""`.
- Her emirde benzersiz `cloid` (hex) ve milisaniye `nonce`/`expiresAfter` kullan.

### 8.7 Info (read) endpoint'leri (POST /info, `method`)
`account_summary`, `account_info`, `account_history`, `positions`, `open_orders`, `order_history`, `fills`, `funding_history`, `user_fees`, `referral_summary`, `transfer_history`, `instrument_leverage`, `all_agents`, `brokers_check`; global: `instruments`, `orderbook`, `bbo`, `mids`, `ticker`, `trades`, `chart`, `oracle`, `supported_collateral`.

`account_summary` döndürür: spot/türev teminat, vault bakiyeleri, `perp_positions` (legs, entry, leverage, liquidation_price, im/mm/upnl), `total_account_equity`, `available_balance`, `total_volume`, `maintenance_margin_utilization` vb.

### 8.8 WebSocket (WSS)
- **Abonelikler:** `bbo`, `chart`, `orderbook`, `mids`, `ticker`, `trades`, `explorer`; hesap: `account_summary`, `fills`, `funding`, `orders`, `positions`.
- **JSON-RPC `post`:** `params.type="info"` (tüm Info) ve `params.type="action"` (tüm Exchange) WS üzerinden de çağrılabilir.
- **Limitler:** IP başına 100 bağlantı, 1.000 abonelik, **2.000 inbound mesaj/dk**, **512 byte** maks mesaj, 256 mesajlık outbound buffer (yavaş tüketici sessizce mesaj kaybeder — mesajları hızlı işle).
- **Heartbeat:** ping/timeout yönetimi şart.

### 8.9 Rate Limits (IP başına)
| Endpoint | Limit |
|---|---|
| `POST /exchange` | 20.000/dk |
| `POST /info` | 5.000/dk · 200.000/saat |
| WSS | 100 bağlantı · 1.000 abonelik · 2.000 msg/dk |

Hata: HTTP 429 (Retry-After), tekrarlı ihlalde HTTP 418 ban (5dk→30dk→2sa→24sa→7g). Header'lar: `X-Used-Weight-1m`, `X-RateLimit-1m`, `X-RateLimit-1h`.

### 8.10 Nonce yönetimi
Nonce'lar milisaniye timestamp tabanlı; çakışmayı önlemek için merkezi, monoton artan bir nonce üretici (Redis) kullan. `expiresAfter` ile emir TTL'i ver.

### 8.11 Fee tier'ları (tasarımı etkiler)
Perp taker %0.025 (standart) → VIP6 %0.020; maker rebate -%0.002 → -%0.014. 14 günlük ağırlıklı hacme göre tier. **Total Volume = Perp + 2×Spot + 2×Stable-Spot.** Maker-first stratejiler hem kullanıcı maliyetini düşürür hem tier'ı yükseltir.

---

## 9. Veri Modeli (özet)

```
User(id, mainAddress, createdAt, settings)
AgentWallet(id, userId, agentAddress, encPrivKeyRef, validUntil, status)
BrokerApproval(id, userId, broker, maxFeeRate, approvedAt, revokedAt)
Strategy(id, userId, type[DCA|GRID|TWAP|FUNDING|REBALANCE|TPSL], status,
         config_json, instrumentIds, builderFeeBps, createdAt)
StrategyRun(id, strategyId, scheduledAt, startedAt, finishedAt, status, error)
ChildOrder(id, strategyRunId, cloid, instrumentId, side, price, size, tif,
           po, ro, brokerFee, status, oid, txHash, fillPrice, feePaid)
Fill(id, userId, oid, instrumentId, price, size, fee, isMaker, ts)
LedgerBuilderFee(id, period, grossFee, claimedTxHash, claimedAt)
AuditLog(id, userId, action, payloadHash, signer, ts)
Alert(id, userId, type, threshold, channel, status)
```

İlkeler: her dış aksiyon `AuditLog`'a `payloadHash` ile yazılır; `ChildOrder.cloid` idempotency anahtarıdır.

---

## 10. Non-Custodial Güvenlik & Risk Modeli

- **Fon emaneti yok:** Para her zaman kullanıcının HotStuff hesabında; uygulama yalnızca agent cüzdanıyla **emir** imzalar, çekim yetkisi vermez (withdraw aksiyonlarını üründe kapalı tut).
- **Agent anahtar yönetimi:** Agent private key, KMS/HSM veya envelope-encryption ile saklanır; `validUntil` kısa tutulur ve rotate edilir. Tercihen kullanıcı başına ayrı agent.
- **Yetki sınırı:** `approveBrokerFee` maxFeeRate düşük tutulur (örn. %0.05–0.1). UI net gösterir.
- **Likidasyon koruması:** Strateji başına maks kaldıraç, maks pozisyon, margin-health guard; eşik altında otomatik dur/azalt.
- **Idempotency & nonce:** cloid + merkezi nonce ile çift-emir önleme.
- **Rate-limit dayanıklılığı:** queue + backoff + jitter; 418 ban'dan kaçınmak için IP/dağıtık worker.
- **Kill-switch:** Global ve strateji-bazlı acil durdurma; tüm açık emirleri `cancelAll`.
- **Gözetim:** Sentry + alert; anormal slippage/red-fill oranlarında otomatik pause.
- **Compliance:** Tokenize hisse/RWA için bölgesel kısıtlar; ToS, risk disclaimer, (gerekirse) geo-gating.

---

## 11. Aşamalı Yol Haritası

### Faz 0 — Hazırlık (Hafta 1)
- Testnet hesapları, builder adresi (≥100 USDC mainnet'te şart), TS SDK kurulumu.
- İmza/`brokers_check`/`account_summary` smoke-test'leri.

### MVP — "Smart Execution + DCA" (Hafta 2–5)
- Cüzdan bağlama, `approveBrokerFee`, `addAgent` akışları.
- Smart Execution: TWAP + limit-ladder + maker-first; her emirde brokerConfig.
- DCA Autopilot (tokenize hisse/kripto), portföy & risk dashboard (WSS).
- Builder konsol: birikmiş fee + `claimReferralRewards`.

### V1 — Bot Suite (Hafta 6–9)
- Grid bot, gelişmiş SL/TP + trailing, funding-rate harvest (delta-neutral).
- Alerts, strateji backtest (geçmiş fill/funding ile), audit & raporlama.

### V2 — Social/Copy + Vault (Hafta 10–14)
- Copy-trading (lider/takipçi, agent mirror), strateji pazar yeri.
- Vault entegrasyonu (`depositToVault`/`redeemFromVault`).
- Mobil/Telegram bot arayüzü (opsiyonel).

---

## 12. Repo / Dosya Yapısı (Scaffold)

```
afterhours/
├─ apps/
│  ├─ web/                      # Next.js dApp
│  │  ├─ app/                   # routes: /, /strategies, /portfolio, /builder
│  │  ├─ components/            # shadcn/ui
│  │  ├─ lib/wallet/            # wagmi/viem, EIP-712 imza yardımcıları
│  │  └─ lib/api/               # backend client (TanStack Query)
│  └─ api/                      # NestJS backend
│     ├─ src/modules/auth/      # SIWE
│     ├─ src/modules/agent/     # addAgent/revokeAgent
│     ├─ src/modules/broker/    # approveBrokerFee, brokers_check, claim
│     ├─ src/modules/strategy/  # CRUD + scheduler
│     ├─ src/modules/execution/ # smart execution engine
│     ├─ src/modules/market/    # WSS feeds, info cache
│     └─ src/modules/portfolio/ # account_summary, positions, risk
├─ packages/
│  ├─ hotstuff-client/          # ts-sdk wrapper (sign, place, info, wss)
│  ├─ strategies/               # DCA, GRID, TWAP, FUNDING, REBALANCE
│  ├─ types/                    # paylaşılan tipler (zod şemalar)
│  └─ config/                   # instrument/opcode sabitleri
├─ prisma/schema.prisma
├─ docker-compose.yml           # postgres + redis
├─ .env.example
└─ README.md
```

---

## 13. Ortam Değişkenleri (.env.example)

```bash
# Ortam
HOTSTUFF_ENV=testnet                 # testnet | mainnet
HOTSTUFF_REST_URL=https://testnet-api.hotstuff.trade
HOTSTUFF_WSS_URL=wss://testnet-api.hotstuff.trade/ws
HOTSTUFF_SOURCE=Testnet              # EIP-712 source: Testnet | Mainnet
HOTSTUFF_CHAIN_ID=1
HOTSTUFF_VERIFYING_CONTRACT=0x...    # resmî HotstuffCore adresi

# Builder
BUILDER_ADDRESS=0xYOURBUILDER...
DEFAULT_BUILDER_FEE_BPS=3            # 3 bps = 0.0003
MAX_BUILDER_FEE_BPS=10

# Agent cüzdan şifreleme
KMS_KEY_ID=...
AGENT_ENC_SECRET=...

# Altyapı
DATABASE_URL=postgresql://user:pass@localhost:5432/afterhours
REDIS_URL=redis://localhost:6379
SENTRY_DSN=...
JWT_SECRET=...
```

---

## 14. Testnet → Mainnet Lansman Planı

1. **Testnet doğrulama:** TWAP/DCA/grid uçtan uca; `brokers_check` onayı, brokerConfig'li fill'ler, claim akışı.
2. **Güvenlik gözden geçirme:** anahtar yönetimi, kill-switch, rate-limit dayanıklılığı, likidasyon guard'ı.
3. **Mainnet hazırlık:** builder adresine ≥100 USDC; düşük `maxFeeRate` ile beta.
4. **Kapalı beta:** sınırlı kullanıcı, düşük pozisyon limitleri, yoğun gözlem.
5. **Genel lansman:** kademeli limit artışı, hacim/retention izleme, Builder Program başvurusu.

---

## 15. Builder Program Başvuru & Puan Stratejisi

- **Organiklik şart:** Self-trade, sybil, manipülatif aktivite puan kazanmaz. Stratejiler gerçek kullanıcı talebine dayanmalı.
- **Hacim kalitesi:** Maker-first yürütme hem kullanıcıya değer hem ekosisteme likidite katar (rebate tier'ları).
- **Anlatı:** Başvuruda "7/24 otomatik yatırım + kurumsal execution" özgün konumlandırmasını, retention ve net-yeni hacim katkısını vurgula.
- **Kanıt:** Testnet metrikleri, demo, mimari, non-custodial güvenlik; Discord'da builder topluluğuyla etkileşim.
- **Ölçülebilir katkı:** Yönlendirilen hacim, aktif kullanıcı, ortalama tutma süresi; "anlamlı katkı" eşiğini aşmaya odaklan (puanlar yalnızca anlamlı katkı sağlayan ekiplere).

---

## 16. KPI'lar ve Başarı Metrikleri

| Metrik | Hedef (90 gün) |
|---|---|
| Yönlendirilen aylık hacim | 50M+ USD |
| Aktif otomatik strateji | 1.000+ |
| 30 günlük retention | %40+ |
| Maker fill oranı | %60+ (rebate + düşük net maliyet) |
| Builder fee geliri | 15K+ USD/ay |
| Başarısız/red emir oranı | %1 altı |

---

## 17. Açık Kararlar / Sorular

- **Arayüz önceliği:** Web dApp (varsayılan) mı, yoksa Telegram bot + web mı?
- **İlk dikey:** DCA/robo-invest (TradFi kitlesi) mi, yoksa funding-harvest/grid (kripto-native) mi öne çıksın?
- **Agent anahtar modeli:** Tam backend-managed mi, yoksa client-side üretilip şifreli saklanan hibrit mi?
- **Ücretlendirme:** Sadece builder fee mi, yoksa builder fee + ince abonelik (premium stratejiler) mi?
- **`verifyingContract` ve instrument ID haritası:** Mainnet/testnet resmî değerleri SDK/`instruments`'tan doğrulanmalı.

---

## 18. EK A — Master Build Prompt (AI agent / IDE'ye kopyala-yapıştır)

```
Sen kıdemli bir full-stack + blockchain mühendisisin. HotStuff L1 (DracoBFT) üzerinde
çalışan, non-custodial bir otomatik trading/yatırım terminali olan "AfterHours"ı kur.

HEDEF
- Kullanıcı adına HotStuff Perp DEX'te otomatik strateji çalıştıran ve her emre builder
  (broker) kodu ekleyerek on-chain fee geliri üreten bir ürün.
- Tamamen non-custodial: kullanıcı yalnızca approveBrokerFee (ana cüzdan) ve addAgent imzalar.

STACK
- Monorepo (pnpm + turborepo). apps/web: Next.js 14 (App Router, TS, Tailwind, shadcn/ui,
  wagmi+viem, TanStack Query, Zustand). apps/api: NestJS (TS). packages/hotstuff-client
  (ts-sdk wrapper), packages/strategies, packages/types (zod), packages/config.
- PostgreSQL + Prisma, Redis + BullMQ, WSS realtime, Sentry, Docker.

HOTSTUFF ENTEGRASYONU (kritik)
- REST: POST /exchange (imzalı aksiyon), POST /info (okuma), POST /explorer.
  Mainnet https://api.hotstuff.trade · Testnet https://testnet-api.hotstuff.trade
- WSS: wss://(testnet-)api.hotstuff.trade/ws (abonelik + JSON-RPC post).
- İmza: EIP-712. action MessagePack ile encode -> keccak256 -> EIP-712 imzala.
  domain={name:"HotstuffCore",version:"1",chainId:1,verifyingContract:<resmî>}.
  types.Action=[source:string, hash:bytes32, txType:uint16]. source=Mainnet|Testnet.
  İmza ÜRETİMİNİ ELLE YAZMA; resmî hotstuff-labs/ts-sdk'yı kullan.
- Op kodları: placeOrder=1301, cancelByOid=1302, cancelAll=1311, cancelByCloid=1312,
  cancelByInstrument=1313, addAgent=1201, revokeAgent=1211, approveBrokerFee=1207,
  claimReferralRewards=1210, updatePerpLeverage=1203.
- Builder akışı:
  1) approveBrokerFee {broker, maxFeeRate:"0.001", nonce} -> ana cüzdan imzalar.
  2) brokers_check (info) ile onayı doğrula.
  3) placeOrder.action.data.brokerConfig={broker, fee:"0.0003"} (fee < maxFeeRate; ondalık,
     0.0003=3bps). Her child-order'a ekle.
  4) claimReferralRewards {collateralId, spot:false, nonce} ile fee'yi çek.
  - Builder adresi mainnet'te >=100 USDC bulundurmalı; perp builder fee <= %1.
- placeOrder order alanları: instrumentId, side(b/s), positionSide(BOTH/LONG/SHORT),
  price, size, tif(GTC/IOC/FOK), ro, po, cloid(hex), triggerPx, isMarket, tpsl, grouping.
  action.data ayrıca: orders[], brokerConfig?, expiresAfter, nonce.
- Nonce: ms-timestamp tabanlı, merkezi monoton üretici (Redis). cloid = idempotency anahtarı.
- Rate limit: /exchange 20k/dk, /info 5k/dk·200k/sa, WSS 2000 msg/dk·512B·100 conn.
  429/418 için backoff+jitter; queue ile koru.

MODÜLLER (MVP)
- Auth (SIWE), Agent (addAgent/revokeAgent), Broker (approve/check/claim),
  Strategy CRUD + scheduler, Execution engine (TWAP + limit-ladder + maker-first,
  her emirde brokerConfig), DCA autopilot, Portfolio/Risk (account_summary + WSS positions/fills),
  Builder console.
- Güvenlik: agent key KMS/envelope-encryption + validUntil rotate; kill-switch (cancelAll);
  margin-health guard; withdraw aksiyonları kapalı.

VERI MODELI: User, AgentWallet, BrokerApproval, Strategy, StrategyRun, ChildOrder, Fill,
LedgerBuilderFee, AuditLog, Alert (yukarıdaki şemaya göre Prisma).

ÇIKTILAR
- Çalışan monorepo iskeleti, .env.example, docker-compose (postgres+redis), Prisma şeması,
  hotstuff-client paketi (sign/place/cancel/info/wss), TWAP + DCA stratejileri,
  testnet'e karşı entegrasyon testleri, README (kurulum + testnet→mainnet adımları).
- Önce testnet (HOTSTUFF_ENV=testnet, source=Testnet) ile uçtan uca doğrula.

KURALLAR: TypeScript strict, zod ile girdi doğrulama, tüm dış aksiyonları AuditLog'a yaz,
idempotent job'lar, kapsamlı hata yönetimi ve loglama. SDK imza yardımcılarını yeniden icat etme.
```

---

## 19. EK B — Kaynaklar

- Builder Program: https://docs.hotstuff.trade/hotstuff-docs/programs/builders
- Hotstuff 101 for Builders: https://docs.hotstuff.trade/hotstuff-docs/for-builders/101
- API — Builders: https://docs.hotstuff.trade/api-reference/getting-started/builders
- API — Signing: https://docs.hotstuff.trade/api-reference/getting-started/signing
- API — SDKs: https://docs.hotstuff.trade/api-reference/getting-started/sdks (Python: github.com/hotstuff-labs/python-sdk · TS: github.com/hotstuff-labs/ts-sdk)
- API — Rate Limits: https://docs.hotstuff.trade/api-reference/getting-started/rate-limits
- brokers_check: https://docs.hotstuff.trade/api-reference/info/accounts/brokers-check
- Place Order: https://docs.hotstuff.trade/api-reference/exchange/trading/place-order
- Approve Broker Fee: https://docs.hotstuff.trade/api-reference/exchange/accounts/approve-broker-fee
- Claim Referral Rewards: https://docs.hotstuff.trade/api-reference/exchange/accounts/claim-referral-rewards
- Add Agent: https://docs.hotstuff.trade/api-reference/exchange/accounts/add-agent
- Deposit to Vault: https://docs.hotstuff.trade/api-reference/exchange/vaults/deposit-to-vault
- account_summary: https://docs.hotstuff.trade/api-reference/info/accounts/account-summary
- Fees: https://docs.hotstuff.trade/hotstuff-docs/trading/fees
- Order Types: https://docs.hotstuff.trade/hotstuff-docs/trading/order-types
- WSS Intro: https://docs.hotstuff.trade/wss/getting-started/introduction
- Points Program: https://docs.hotstuff.trade/hotstuff-docs/programs/points
- Docs index (llms.txt): https://docs.hotstuff.trade/llms.txt
- App: https://app.hotstuff.trade · Site: https://www.hotstuff.trade
