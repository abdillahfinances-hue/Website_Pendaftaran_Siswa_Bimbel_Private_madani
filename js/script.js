/* ============================================================
   BIMBEL MADANI - script.js
   File ini dipakai bareng di 3 halaman:
   - daftar-tentor.html (tentor isi data sendiri)
   - tentor.html         (tampilkan semua tentor)
   - formulir.html       (form pendaftaran calon murid)

   Setiap bagian dikasih pengecekan "if elemen ada" duluan,
   supaya kode ini aman dipanggil di halaman manapun tanpa error.
   ============================================================ */

const STORAGE_KEY = "madani_tentors";
const PROGRAM_NAMES = {
  KMPU: "Kelas Mata Pelajaran Umum",
  KMPI: "Kelas Mengaji & Pendidikan Islam",
  KBA: "Kelas Bahasa Asing"
};
const ADMIN_WA_NUMBER = "6288201552435"; // 0882-0155-2435 (Bima)

/* ------------------------------------------------------------
   FUNGSI BANTUAN (dipakai di beberapa bagian)
------------------------------------------------------------ */
function getTentors() {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

function saveTentors(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

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
  formTentor.addEventListener("submit", function (e) {
    e.preventDefault();

    // Cek dulu semua field wajib udah keisi (pakai validasi browser bawaan)
    if (!formTentor.reportValidity()) {
      return; // browser otomatis nunjukin field mana yang belum keisi
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
      id: Date.now(), // dipakai sebagai ID unik, berdasarkan waktu submit
      nama: document.getElementById("t_nama").value.trim(),
      pendidikan: document.getElementById("t_pendidikan").value.trim(),
      institusi: document.getElementById("t_institusi").value.trim(),
      program: document.getElementById("t_program").value,
      jenjang: jenjangTercentang,
      status: document.getElementById("t_status").value,
      wilayah: document.getElementById("t_wilayah").value.trim(),
      jadwal: document.getElementById("t_jadwal").value.trim(),
      deskripsi: document.getElementById("t_deskripsi").value.trim()
    };

    const daftarTentor = getTentors();
    daftarTentor.push(tentorBaru);
    saveTentors(daftarTentor);

    alert("Data berhasil disimpan! Kamu akan diarahkan ke halaman daftar tentor.");
    formTentor.reset();
    window.location.href = "tentor.html";
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
  const semuaTentor = getTentors();

  const gridPerProgram = {
    KMPU: gridKMPU,
    KMPI: gridKMPI,
    KBA: gridKBA
  };

  // Kosongkan dulu isi grid (hapus tulisan "Belum ada tentor terdaftar")
  Object.values(gridPerProgram).forEach(grid => (grid.innerHTML = ""));

  // Hitung berapa tentor per program, buat nentuin
  // apakah pesan "belum ada tentor" perlu ditampilkan lagi
  const jumlahPerProgram = { KMPU: 0, KMPI: 0, KBA: 0 };

  semuaTentor.forEach(t => {
    const grid = gridPerProgram[t.program];
    if (!grid) return; // kalau program-nya gak dikenali, lewati

    jumlahPerProgram[t.program]++;

    const card = document.createElement("div");
    card.className = "tentor-card";

    const statusClass = t.status === "Tetap" ? "status-tetap" : "status-parttime";
    const badgeJenjang = t.jenjang
      .map(j => `<span class="badge-jenjang">${j}</span>`)
      .join("");

    card.innerHTML = `
      <div class="tentor-avatar">${getInisial(t.nama)}</div>
      <h3>${t.nama}</h3>
      <p class="tentor-pendidikan">${t.pendidikan}, ${t.institusi}</p>
      <div class="tentor-badges">
        ${badgeJenjang}
        <span class="status-tag ${statusClass}">${t.status}</span>
      </div>
      <p class="tentor-meta">📍 ${t.wilayah}</p>
      <p class="tentor-meta">🕒 ${t.jadwal}</p>
      <p class="tentor-quote">"${t.deskripsi}"</p>
      <a href="formulir.html?tentor=${encodeURIComponent(t.nama)}&program=${t.program}" class="btn btn-full">Pilih Tentor</a>
    `;

    grid.appendChild(card);
  });

  // Kalau ada program yang masih 0 tentor, munculin lagi pesan kosongnya
  Object.keys(jumlahPerProgram).forEach(program => {
    if (jumlahPerProgram[program] === 0) {
      gridPerProgram[program].innerHTML =
        '<p class="tentor-kosong">Belum ada tentor terdaftar untuk program ini.</p>';
    }
  });
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

    const tentorSesuaiProgram = getTentors().filter(
      t => t.program === programTerpilih
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

  // ---- 3e. Submit form -> validasi + buka WhatsApp ----
  formDaftar.addEventListener("submit", function (e) {
    e.preventDefault();

    if (!formDaftar.reportValidity()) {
      return;
    }

    const data = {
      siswaNama: document.getElementById("siswa_nama").value.trim(),
      ortuNama: document.getElementById("ortu_nama").value.trim(),
      program: selectProgram.value,
      programNama: PROGRAM_NAMES[selectProgram.value] || selectProgram.value,
      jenjang: selectJenjang.value,
      tentor: selectTentor.value,
      wilayah: document.getElementById("f_wilayah").value
    };

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
  });
}
