/* ============================================================
   BIMBEL MADANI - script.js
   File ini dipakai bareng di 3 halaman:
   - daftar-tentor.html (tentor isi data sendiri)
   - tentor.html         (tampilkan semua tentor)
   - formulir.html       (form pendaftaran calon murid)

   Setiap bagian dikasih pengecekan "if elemen ada" duluan,
   supaya kode ini aman dipanggil di halaman manapun tanpa error.
   ============================================================ */

const PROGRAM_NAMES = {
  KMPU: "Kelas Mata Pelajaran Umum",
  KMPI: "Kelas Mengaji & Pendidikan Islam",
  KBA: "Kelas Bahasa Asing"
};
const ADMIN_WA_NUMBER = "62882015524358"; // +62 882-0155-24358 (Bima)
const GOOGLE_SHEETS_URL = "https://script.google.com/macros/s/AKfycbx1dBwLbkikDGe_S3u6XKAdP_cqx7GNFlyw-YJ6m_6Vn1UUkWNZDOsCvdaav0oGlevrwQ/exec";

/* ------------------------------------------------------------
   FUNGSI BANTUAN (dipakai di beberapa bagian)
------------------------------------------------------------ */
function getInisial(nama) {
  return nama
    .trim()
    .split(" ")
    .map(kata => kata[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}


/* ============================================================
   BAGIAN 1: FORM TENTOR (daftar-tentor.html)
   Saat tentor submit form -> data disimpan ke localStorage
============================================================ */
const formTentor = document.getElementById("form-tentor");

if (formTentor) {
  formTentor.addEventListener("submit", async function (e) {
    e.preventDefault();

    // Cek dulu semua field wajib udah keisi (pakai validasi browser bawaan)
    if (!formTentor.reportValidity()) {
      return; // browser otomatis nunjukin field mana yang belum keisi
    }

    // Ambil semua program yang dicentang (checkbox bisa lebih dari satu)
    const programTercentang = Array.from(
      document.querySelectorAll('input[name="t_program"]:checked')
    ).map(cb => cb.value);

    if (programTercentang.length === 0) {
      alert("Mohon pilih minimal 1 program yang diajar.");
      return;
    }

    // Ambil semua jenjang yang dicentang (checkbox bisa lebih dari satu)
    const jenjangTercentang = Array.from(
      document.querySelectorAll('input[name="t_jenjang"]:checked')
    ).map(cb => cb.value);

    if (jenjangTercentang.length === 0) {
      alert("Mohon pilih minimal 1 jenjang yang bisa diajar.");
      return;
    }

    const tentorBaru = {
      jenis: "tentor", // penanda buat Apps Script, biar tau ini data tentor bukan pendaftaran murid
      id: Date.now(),
      nama: document.getElementById("t_nama").value.trim(),
      pendidikan: document.getElementById("t_pendidikan").value.trim(),
      institusi: document.getElementById("t_institusi").value.trim(),
      program: programTercentang,
      jenjang: jenjangTercentang,
      status: document.getElementById("t_status").value,
      wilayah: document.getElementById("t_wilayah").value.trim(),
      jadwal: document.getElementById("t_jadwal").value.trim(),
      foto: document.getElementById("t_foto").value.trim(),
      deskripsi: document.getElementById("t_deskripsi").value.trim()
    };

    const tombolSubmitTentor = formTentor.querySelector('button[type="submit"]');
    tombolSubmitTentor.disabled = true;
    tombolSubmitTentor.textContent = "Mengirim...";

    try {
      await fetch(GOOGLE_SHEETS_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(tentorBaru)
      });
      alert("Data berhasil disimpan! Kamu akan diarahkan ke halaman daftar tentor.");
      formTentor.reset();
      window.location.href = "tentor.html";
    } catch (error) {
      console.error("Gagal mengirim data tentor:", error);
      alert("Gagal mengirim data. Cek koneksi internet kamu, lalu coba lagi.");
      tombolSubmitTentor.disabled = false;
      tombolSubmitTentor.textContent = "Kirim & Tampilkan di Halaman Tentor";
    }
  });
}


/* ============================================================
   BAGIAN 2: TAMPILKAN TENTOR (tentor.html)
   Baca data dari localStorage, kelompokkan per program,
   lalu tampilkan sebagai card
============================================================ */
const gridKMPU = document.getElementById("grid-kmpu");
const gridKMPI = document.getElementById("grid-kmpi");
const gridKBA = document.getElementById("grid-kba");

if (gridKMPU && gridKMPI && gridKBA) {
  // Cek dulu apakah user datang dari link tertentu, misal tentor.html?program=KMPU
  // Kalau ada, sembunyikan 2 section lainnya, cuma tampilkan yang dipilih
  const urlParamsTentor = new URLSearchParams(window.location.search);
  const programDipilih = urlParamsTentor.get("program");

  const sectionPerProgram = {
    KMPU: document.getElementById("tentor-kmpu"),
    KMPI: document.getElementById("tentor-kmpi"),
    KBA: document.getElementById("tentor-kba")
  };

  if (programDipilih && sectionPerProgram[programDipilih]) {
    Object.keys(sectionPerProgram).forEach(prog => {
      if (prog !== programDipilih) {
        sectionPerProgram[prog].style.display = "none";
      }
    });
  }
  // Kalau gak ada ?program= di URL (misal user klik "Lihat Tentor" dari nav biasa),
  // semua section tetap ditampilkan seperti biasa.

  const gridPerProgram = {
    KMPU: gridKMPU,
    KMPI: gridKMPI,
    KBA: gridKBA
  };

  // Tampilkan pesan loading dulu sementara nunggu data dari Sheets
  Object.values(gridPerProgram).forEach(grid => {
    grid.innerHTML = '<p class="tentor-kosong">Memuat data tentor...</p>';
  });

  fetch(GOOGLE_SHEETS_URL + "?jenis=tentor")
    .then(res => res.json())
    .then(semuaTentor => {
      // Kosongkan grid (hapus tulisan "Memuat...")
      Object.values(gridPerProgram).forEach(grid => (grid.innerHTML = ""));

      const jumlahPerProgram = { KMPU: 0, KMPI: 0, KBA: 0 };

      semuaTentor.forEach(t => {
        t.program.forEach(programIni => {
          const grid = gridPerProgram[programIni];
          if (!grid) return;

          jumlahPerProgram[programIni]++;
          grid.appendChild(buatCardTentor(t, programIni));
        });
      });

      Object.keys(jumlahPerProgram).forEach(program => {
        if (jumlahPerProgram[program] === 0) {
          gridPerProgram[program].innerHTML =
            '<p class="tentor-kosong">Belum ada tentor terdaftar untuk program ini.</p>';
        }
      });
    })
    .catch(error => {
      console.error("Gagal memuat data tentor:", error);
      Object.values(gridPerProgram).forEach(grid => {
        grid.innerHTML = '<p class="tentor-kosong">Gagal memuat data. Coba refresh halaman.</p>';
      });
    });

  // Fungsi bikin 1 elemen card tentor (dipanggil ulang tiap program dia diajar)
  function buatCardTentor(t, programIni) {
    const card = document.createElement("div");
    card.className = "tentor-card";

    const statusClass = t.status === "Tetap" ? "status-tetap" : "status-parttime";
    const badgeJenjang = t.jenjang
      .map(j => `<span class="badge-jenjang">${j}</span>`)
      .join("");

    // Kalau tentor isi link foto, pakai <img>. Kalau kosong, pakai avatar inisial.
    const fotoHtml = t.foto
      ? `<img src="${t.foto}" alt="Foto ${t.nama}" class="tentor-foto" onerror="this.outerHTML='<div class=&quot;tentor-avatar&quot;>${getInisial(t.nama)}</div>'">`
      : `<div class="tentor-avatar">${getInisial(t.nama)}</div>`;

    card.innerHTML = `
  ${fotoHtml}
  <h3>${t.nama}</h3>
  <p class="tentor-pendidikan">${t.pendidikan}, ${t.institusi}</p>
  <p class="tentor-label">Jenjang yang Diajar:</p>
  <div class="tentor-badges">
    ${badgeJenjang}
    <span class="status-tag ${statusClass}">${t.status}</span>
  </div>
  <p class="tentor-meta">📍 <strong>Wilayah Mengajar:</strong> ${t.wilayah}</p>
  <p class="tentor-meta">🕒 <strong>Jadwal Ketersediaan:</strong> ${t.jadwal}</p>


      <p class="tentor-quote desc-clamp">"${t.deskripsi}"</p>
      <button type="button" class="btn-readmore">Baca Selengkapnya</button>
      <a href="formulir.html?tentor=${encodeURIComponent(t.nama)}&program=${programIni}" class="btn btn-full">Pilih Tentor</a>
    `;

    // Tombol "Baca Selengkapnya" -> toggle class buat hilangin batas tinggi teks
    const tombolReadMore = card.querySelector(".btn-readmore");
    const teksDeskripsi = card.querySelector(".desc-clamp");
    tombolReadMore.addEventListener("click", function () {
      teksDeskripsi.classList.toggle("desc-expanded");
      tombolReadMore.textContent = teksDeskripsi.classList.contains("desc-expanded")
        ? "Tutup"
        : "Baca Selengkapnya";
    });

    return card;
  }
}


/* ============================================================
   BAGIAN 3: FORM PENDAFTARAN (formulir.html)
============================================================ */
const formDaftar = document.getElementById("form-daftar");

if (formDaftar) {
  const selectProgram = document.getElementById("f_program");
  const selectJenjang = document.getElementById("f_jenjang");
  const selectTentor = document.getElementById("f_tentor");
  const fieldMapel = document.getElementById("field-mapel");

  // ---- 3a. Isi ulang dropdown Tentor sesuai program yang dipilih ----
  function isiDropdownTentor(programTerpilih, tentorTerpilihNama) {
    selectTentor.innerHTML = "";

    if (!programTerpilih) {
      selectTentor.innerHTML =
        '<option value="">— Pilih Program dulu untuk melihat tentor —</option>';
      return;
    }

    selectTentor.innerHTML = '<option value="">Memuat data tentor...</option>';

    fetch(GOOGLE_SHEETS_URL + "?jenis=tentor")
      .then(res => res.json())
      .then(semuaTentor => {
        const tentorSesuaiProgram = semuaTentor.filter(
          t => t.program.includes(programTerpilih)
        );

        if (tentorSesuaiProgram.length === 0) {
          selectTentor.innerHTML =
            '<option value="">— Belum ada tentor untuk program ini —</option>';
          return;
        }

        selectTentor.innerHTML = '<option value="">— Pilih Tentor —</option>';
        tentorSesuaiProgram.forEach(t => {
          const opt = document.createElement("option");
          opt.value = t.nama;
          opt.textContent = t.nama;
          if (tentorTerpilihNama && t.nama === tentorTerpilihNama) {
            opt.selected = true;
          }
          selectTentor.appendChild(opt);
        });
      })
      .catch(error => {
        console.error("Gagal memuat data tentor:", error);
        selectTentor.innerHTML = '<option value="">Gagal memuat tentor, coba refresh</option>';
      });
  }

  // ---- 3b. Munculkan/sembunyikan field Mata Pelajaran ----
  function cekFieldMapel() {
    if (selectJenjang.value === "SMA") {
      fieldMapel.style.display = "block";
    } else {
      fieldMapel.style.display = "none";
      document.getElementById("f_mapel").value = "";
    }
  }

  // ---- 3c. Baca parameter URL (?tentor=...&program=...) ----
  const urlParams = new URLSearchParams(window.location.search);
  const programDariURL = urlParams.get("program");
  const tentorDariURL = urlParams.get("tentor");

  if (programDariURL) {
    selectProgram.value = programDariURL;
  }
  isiDropdownTentor(selectProgram.value, tentorDariURL);
  cekFieldMapel();

  // ---- 3d. Event listener untuk perubahan pilihan ----
  selectProgram.addEventListener("change", function () {
    isiDropdownTentor(this.value, null);
  });

  selectJenjang.addEventListener("change", cekFieldMapel);

  // ---- 3e. Submit form -> kirim ke Google Sheets, lalu buka WhatsApp ----
  formDaftar.addEventListener("submit", async function (e) {
    e.preventDefault();

    if (!formDaftar.reportValidity()) {
      return;
    }

    const tombolSubmit = formDaftar.querySelector('button[type="submit"]');
    tombolSubmit.disabled = true;
    tombolSubmit.textContent = "Mengirim...";

    const data = {
      siswaNama: document.getElementById("siswa_nama").value.trim(),
      siswaTempat: document.getElementById("siswa_tempat").value.trim(),
      siswaTanggal: document.getElementById("siswa_tanggal").value,
      siswaAlamat: document.getElementById("siswa_alamat").value.trim(),
      siswaTinggal: document.getElementById("siswa_tinggal").value.trim(),
      siswaSekolah: document.getElementById("siswa_sekolah").value.trim(),
      siswaKet: document.getElementById("siswa_ket").value.trim(),
      ortuNama: document.getElementById("ortu_nama").value.trim(),
      ortuHp: document.getElementById("ortu_hp").value.trim(),
      ortuKerja: document.getElementById("ortu_kerja").value.trim(),
      ortuAlamat: document.getElementById("ortu_alamat").value.trim(),
      program: selectProgram.value,
      programNama: PROGRAM_NAMES[selectProgram.value] || selectProgram.value,
      jenjang: selectJenjang.value,
      mapel: document.getElementById("f_mapel").value.trim(),
      tentor: selectTentor.value,
      wilayah: document.getElementById("f_wilayah").value
    };

    // ---- Kirim ke Google Sheets dulu ----
    try {
      await fetch(GOOGLE_SHEETS_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(data)
      });
    } catch (error) {
      console.error("Gagal mengirim ke Google Sheets:", error);
      // Data tetap lanjut ke WA walau gagal kirim ke Sheets,
      // biar pendaftaran gak gagal total gara-gara koneksi.
    }

    // ---- Baru setelah itu, buka WhatsApp ----
    const pesanWA =
      `Halo Admin Bimbel Private Madani.\n\n` +
      `Saya telah melakukan pendaftaran.\n\n` +
      `Nama Siswa: ${data.siswaNama}\n` +
      `Nama Orang Tua: ${data.ortuNama}\n` +
      `Program: ${data.programNama}\n` +
      `Jenjang: ${data.jenjang}\n` +
      `Tentor: ${data.tentor}\n` +
      `Wilayah: ${data.wilayah}\n\n` +
      `Mohon informasi mengenai pembayaran biaya pendaftaran. Terima kasih.`;

    const waUrl = `https://wa.me/${ADMIN_WA_NUMBER}?text=${encodeURIComponent(pesanWA)}`;

    alert("Pendaftaran berhasil! Kamu akan diarahkan ke WhatsApp Admin untuk konfirmasi.");
    window.open(waUrl, "_blank");
    formDaftar.reset();

    tombolSubmit.disabled = false;
    tombolSubmit.textContent = "Kirim Pendaftaran";
  });
}
