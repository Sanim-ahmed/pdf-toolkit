# 📄 PDF Toolkit

A modern full-stack PDF toolkit built with **Next.js**, **FastAPI**, and **Python**.

Convert, merge, split, compress, and manage PDF files through a clean, responsive web interface.

## 🌐 Live Demo

**Website:** https://pdf-toolkit-zeta-nine.vercel.app/

---

## ✨ Features

- 📄 PDF → Word
- 📝 Word → PDF
- 🔀 Merge PDF
- ✂️ Split PDF
- 🗜️ Compress PDF
- 📖 PDF → Text
- ✍️ Text → PDF
- 🖼️ Image → PDF
- 🖼️ PDF → Image
- 🔍 OCR (Image/PDF → Text)

---

## 🛠️ Tech Stack

### Frontend
- Next.js
- React
- TypeScript
- Tailwind CSS

### Backend
- FastAPI
- Python
- Uvicorn

### PDF Processing
- PyPDF2
- pdfplumber
- pdf2docx
- python-docx
- Pillow
- pdf2image
- pytesseract

---

## 🚀 Run Locally

### Clone the repository

```bash
git clone https://github.com/Sanim-ahmed/pdf-toolkit.git
cd pdf-toolkit
```

### Backend

```bash
cd backend
python -m venv .venv

# Linux/macOS
source .venv/bin/activate

# Windows
.venv\Scripts\activate

pip install -r requirements.txt

uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open:

```
http://localhost:3000
```

---

## 📂 Project Structure

```
pdf-toolkit/
├── backend/
├── frontend/
├── docker-compose.yml
└── README.md
```

---

## 🔮 Future Improvements

- Better OCR performance
- Batch processing
- Drag & reorder pages
- Password protection
- Cloud storage integration

---

## 👨‍💻 Author

**Sanim Ahmed Khan**

📧 Email: sanimahmedofficial@gmail.com

💼 LinkedIn: https://www.linkedin.com/in/sanimahmedkhan/

GitHub: https://github.com/Sanim-ahmed

---

## ⭐ Support

If you found this project useful, consider giving it a **⭐ Star** on GitHub.
