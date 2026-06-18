# 場勘報價清單產生器

免安裝的文字版 MVP 網頁工具。貼上 LINE 對話或場勘紀錄後，可整理成不含價格的施工細項清單，並依空間分類顯示在綠色估價單版型中。

## 功能

- React + Vite + Tailwind CSS
- 左側輸入客戶資料與場勘文字，右側即時預覽估價單
- 版型參考正式清潔估價單：客戶資料、特別說明、房型、施作項目、條款及簽名區
- AI 自動整理施工細項
- 無 API Key 時會使用本機關鍵字規則整理，方便先試用
- 施工項目分類：
  - 牆面地面
  - 客廳玄關
  - 臥室
  - 廁所
  - 廚房
  - 陽台
  - 窗戶
  - 注意事項
  - 其他
- 每列包含編號、區域、施工細項
- 資訊不足會標示「待確認」
- 一鍵複製結果
- 下載 PDF
- 下載 Excel
- 依目前 MVP 需求不產出價格；費用欄位會保留為人工確認區

## 安裝 Node.js

1. 前往 [Node.js 官方網站](https://nodejs.org/)。
2. 下載 LTS 版本。
3. 安裝時使用預設選項即可。
4. 安裝完成後開啟終端機，輸入：

```bash
node -v
npm -v
```

若看到版本號，代表安裝成功。

## 安裝專案套件

在專案資料夾內執行：

```bash
npm install
```

## 啟動開發伺服器

```bash
npm run dev
```

啟動後終端機會顯示本機網址，通常是：

```text
http://localhost:5173
```

用瀏覽器打開即可使用。

## 設定 OpenAI API Key

本專案的 AI 整理功能透過 `/api/organize` 後端代理呼叫 OpenAI，不會把 API Key 放進前端程式碼。

1. 複製 `.env.example` 成 `.env`。
2. 在 `.env` 裡填入你的 API Key：

```env
OPENAI_API_KEY=sk-proj-your-api-key
OPENAI_MODEL=gpt-4.1-mini
```

3. 重新啟動開發伺服器：

```bash
npm run dev
```

若沒有設定 API Key，按下「AI 自動整理」時仍會使用本機規則產生清單。

## 下載 PDF

右上角「下載 PDF」會將右側估價單預覽轉成 PDF 檔，繁體中文會以畫面截圖方式保留。旁邊的「PDF」按鈕會開啟瀏覽器列印視窗，也可以選擇「另存為 PDF」。

## 下載 Excel

右上角 Excel 圖示會下載 `.xlsx` 檔案，包含：

- 基本資料
- 施工項目

## 部署到 Vercel

這是建議的正式網頁版部署方式。部署後會得到公開網址，其他人不用安裝任何東西就能使用。

1. 將專案推到 GitHub。
2. 前往 [Vercel](https://vercel.com/) 並登入。
3. 點選 `Add New Project`。
4. 選擇你的 GitHub repository。
5. Framework Preset 選擇 `Vite`。
6. Build Command 使用：

```bash
npm run build
```

7. Output Directory 使用：

```text
dist
```

8. 在 Vercel 專案設定的 `Environment Variables` 新增：

```env
OPENAI_API_KEY=sk-proj-your-api-key
OPENAI_MODEL=gpt-4.1-mini
```

9. 點選 Deploy。

部署完成後，網站即可使用。若未設定 `OPENAI_API_KEY`，前端仍可用本機規則整理，但不會呼叫 OpenAI。

## 正式上線前檢查

```bash
npm install
npm run build
```

確認 build 成功後再部署。

## 網頁版注意事項

- `OPENAI_API_KEY` 只能放在 Vercel Environment Variables，不要寫進前端程式碼。
- PDF / Excel 匯入是在瀏覽器本機解析，不會上傳到伺服器。
- 若 PDF 是掃描圖片，文字可能無法被讀取；需要 OCR 才能辨識。
- 匯出的 PDF 會以右側估價單畫面轉成圖片，繁體中文顯示會比較穩定。

## 常用指令

```bash
npm install
npm run dev
npm run build
npm run preview
```
