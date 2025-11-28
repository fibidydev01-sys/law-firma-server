// ============================================================
// PRISMA SEED - COMPREHENSIVE LAW FIRM DATA (IMPROVED)
// ============================================================

import {
  PrismaClient,
  UserRole,
  JenisPerkara,
  StatusPerkara,
  StatusTugas,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive database seed...\n');

  // ============================================================
  // STEP 1: CLEANUP EXISTING SEED DATA (SAFE MODE)
  // ============================================================
  console.log('🧹 Cleaning up existing seed data...');

  try {
    const userIds = await getUserIds();

    if (userIds.length > 0) {
      await prisma.pemeriksaanKonflik.deleteMany({
        where: { diperiksa_oleh: { in: userIds } },
      });

      await prisma.dokumenHukum.deleteMany({
        where: { diunggah_oleh: { in: userIds } },
      });

      await prisma.jadwalSidang.deleteMany({
        where: { dibuat_oleh: { in: userIds } },
      });

      await prisma.tugas.deleteMany({
        where: { dibuat_oleh: { in: userIds } },
      });
    }

    await prisma.timPerkara.deleteMany({});

    await prisma.perkara.deleteMany({
      where: { nomor_perkara: { startsWith: 'PKR/2024/' } },
    });

    await prisma.klien.deleteMany({
      where: {
        OR: [
          { email: { contains: '@teknologi.co.id' } },
          { email: { contains: '@wijaya' } },
          { email: { contains: '@maju' } },
        ],
      },
    });

    console.log('✓ Cleanup completed\n');
  } catch {
    console.log('⚠️  Skipping cleanup (fresh database)\n');
  }

  // ============================================================
  // STEP 2: CREATE USERS (ALL ROLES!)
  // ============================================================
  const hashedPassword = await bcrypt.hash('Admin123!', 10);

  // 1. ADMIN
  const admin = await prisma.user.upsert({
    where: { email: 'admin@perari.id' },
    update: {
      password: hashedPassword,
      nama_lengkap: 'Administrator PERARI',
      role: UserRole.admin,
      jabatan: 'System Administrator',
      telepon: '081234567890',
    },
    create: {
      email: 'admin@perari.id',
      password: hashedPassword,
      nama_lengkap: 'Administrator PERARI',
      role: UserRole.admin,
      jabatan: 'System Administrator',
      telepon: '081234567890',
    },
  });
  console.log('✅ Admin user created:', admin.email);

  // 2. PARTNER (CRITICAL - SENIOR MANAGEMENT!)
  const partner = await prisma.user.upsert({
    where: { email: 'partner@perari.id' },
    update: {
      password: hashedPassword,
      nama_lengkap: 'Prof. Dr. Haryanto Saputra, S.H., M.H., LL.M.',
      role: UserRole.partner,
      jabatan: 'Senior Partner',
      nomor_kta: 'ADV-2015-001',
      nomor_berita_acara: 'BA-001/2015/PN-JKT',
      spesialisasi: 'Corporate Law, Merger & Acquisition, Litigation',
      telepon: '081234567895',
    },
    create: {
      email: 'partner@perari.id',
      password: hashedPassword,
      nama_lengkap: 'Prof. Dr. Haryanto Saputra, S.H., M.H., LL.M.',
      role: UserRole.partner,
      jabatan: 'Senior Partner',
      nomor_kta: 'ADV-2015-001',
      nomor_berita_acara: 'BA-001/2015/PN-JKT',
      spesialisasi: 'Corporate Law, Merger & Acquisition, Litigation',
      telepon: '081234567895',
    },
  });
  console.log('✅ Partner user created:', partner.email);

  // 3. ADVOKAT (Multiple lawyers)
  const advokat1 = await prisma.user.upsert({
    where: { email: 'advokat@perari.id' },
    update: {
      password: hashedPassword,
      nama_lengkap: 'Dr. Budi Santoso, S.H., M.H.',
      role: UserRole.advokat,
      jabatan: 'Advokat Senior',
      nomor_kta: 'ADV-2020-001',
      nomor_berita_acara: 'BA-001/2020/PN-JKT',
      spesialisasi: 'Hukum Perdata, Hukum Pidana',
      telepon: '081234567891',
    },
    create: {
      email: 'advokat@perari.id',
      password: hashedPassword,
      nama_lengkap: 'Dr. Budi Santoso, S.H., M.H.',
      role: UserRole.advokat,
      jabatan: 'Advokat Senior',
      nomor_kta: 'ADV-2020-001',
      nomor_berita_acara: 'BA-001/2020/PN-JKT',
      spesialisasi: 'Hukum Perdata, Hukum Pidana',
      telepon: '081234567891',
    },
  });
  console.log('✅ Advokat 1 created:', advokat1.email);

  const advokat2 = await prisma.user.upsert({
    where: { email: 'advokat2@perari.id' },
    update: {
      password: hashedPassword,
      nama_lengkap: 'Dewi Lestari, S.H., M.H.',
      role: UserRole.advokat,
      jabatan: 'Advokat',
      nomor_kta: 'ADV-2021-045',
      nomor_berita_acara: 'BA-045/2021/PN-JKT',
      spesialisasi: 'Hukum Tata Negara, Hukum HAM',
      telepon: '081234567896',
    },
    create: {
      email: 'advokat2@perari.id',
      password: hashedPassword,
      nama_lengkap: 'Dewi Lestari, S.H., M.H.',
      role: UserRole.advokat,
      jabatan: 'Advokat',
      nomor_kta: 'ADV-2021-045',
      nomor_berita_acara: 'BA-045/2021/PN-JKT',
      spesialisasi: 'Hukum Tata Negara, Hukum HAM',
      telepon: '081234567896',
    },
  });
  console.log('✅ Advokat 2 created:', advokat2.email);

  // 4. PARALEGAL
  const paralegal = await prisma.user.upsert({
    where: { email: 'paralegal@perari.id' },
    update: {
      password: hashedPassword,
      nama_lengkap: 'Siti Rahayu, S.H.',
      role: UserRole.paralegal,
      jabatan: 'Paralegal',
      telepon: '081234567892',
    },
    create: {
      email: 'paralegal@perari.id',
      password: hashedPassword,
      nama_lengkap: 'Siti Rahayu, S.H.',
      role: UserRole.paralegal,
      jabatan: 'Paralegal',
      telepon: '081234567892',
    },
  });
  console.log('✅ Paralegal created:', paralegal.email);

  // 5. STAFF
  const staff = await prisma.user.upsert({
    where: { email: 'staff@perari.id' },
    update: {
      password: hashedPassword,
      nama_lengkap: 'Andi Wijaya',
      role: UserRole.staff,
      jabatan: 'Staff Administrasi',
      telepon: '081234567893',
    },
    create: {
      email: 'staff@perari.id',
      password: hashedPassword,
      nama_lengkap: 'Andi Wijaya',
      role: UserRole.staff,
      jabatan: 'Staff Administrasi',
      telepon: '081234567893',
    },
  });
  console.log('✅ Staff created:', staff.email);

  // 6. KLIEN
  const klienUser = await prisma.user.upsert({
    where: { email: 'klien@perari.id' },
    update: {
      password: hashedPassword,
      nama_lengkap: 'Klien Portal User',
      role: UserRole.klien,
      jabatan: 'Klien',
      telepon: '081234567894',
    },
    create: {
      email: 'klien@perari.id',
      password: hashedPassword,
      nama_lengkap: 'Klien Portal User',
      role: UserRole.klien,
      jabatan: 'Klien',
      telepon: '081234567894',
    },
  });
  console.log('✅ Klien user created:', klienUser.email);

  // ============================================================
  // STEP 3: CREATE CLIENTS (Multiple types)
  // ============================================================
  const klien1 = await prisma.klien.create({
    data: {
      nama: 'PT. Teknologi Nusantara',
      jenis_klien: 'perusahaan',
      nomor_identitas: '3174010101900001',
      npwp: '01.234.567.8-901.000',
      email: 'contact@teknologi.co.id',
      telepon: '0212345678',
      alamat: 'Jl. Sudirman No. 123, Gedung Sudirman Tower Lt. 25',
      kelurahan: 'Menteng',
      kecamatan: 'Menteng',
      kota: 'Jakarta Pusat',
      provinsi: 'DKI Jakarta',
      kode_pos: '10310',
      nama_perusahaan: 'PT. Teknologi Nusantara',
      bentuk_badan_usaha: 'PT',
      nomor_akta: 'AHU-0012345.AH.01.01.Tahun 2020',
      dibuat_oleh: partner.id,
    },
  });
  console.log('✅ Client 1 created:', klien1.nama);

  const klien2 = await prisma.klien.create({
    data: {
      nama: 'Ahmad Wijaya',
      jenis_klien: 'perorangan',
      nomor_identitas: '3174020202850001',
      email: 'ahmad.wijaya@email.com',
      telepon: '081298765432',
      alamat: 'Jl. Gatot Subroto No. 45, Apartemen Senayan Residence Tower A/1203',
      kelurahan: 'Senayan',
      kecamatan: 'Kebayoran Baru',
      kota: 'Jakarta Selatan',
      provinsi: 'DKI Jakarta',
      kode_pos: '12190',
      dibuat_oleh: advokat1.id,
    },
  });
  console.log('✅ Client 2 created:', klien2.nama);

  const klien3 = await prisma.klien.create({
    data: {
      nama: 'CV. Maju Bersama',
      jenis_klien: 'perusahaan',
      nomor_identitas: '3171051234567890',
      npwp: '02.345.678.9-012.000',
      email: 'info@majubersama.co.id',
      telepon: '0218765432',
      alamat: 'Jl. Thamrin No. 88',
      kelurahan: 'Gondangdia',
      kecamatan: 'Menteng',
      kota: 'Jakarta Pusat',
      provinsi: 'DKI Jakarta',
      kode_pos: '10350',
      nama_perusahaan: 'CV. Maju Bersama',
      bentuk_badan_usaha: 'CV',
      nomor_akta: 'AHU-0056789.AH.01.01.Tahun 2021',
      dibuat_oleh: paralegal.id,
    },
  });
  console.log('✅ Client 3 created:', klien3.nama);

  // ============================================================
  // STEP 4: CREATE CASES (Multiple types)
  // ============================================================
  const perkara1 = await prisma.perkara.create({
    data: {
      nomor_perkara: 'PKR/2024/001',
      nomor_perkara_pengadilan: '123/Pdt.G/2024/PN.Jkt.Sel',
      judul: 'Gugatan Wanprestasi PT. Teknologi vs PT. ABC',
      deskripsi:
        'Gugatan wanprestasi terkait perjanjian kerja sama bisnis senilai 5 Miliar. Klien sebagai penggugat menuntut ganti rugi akibat pelanggaran kontrak.',
      klien_id: klien1.id,
      jenis_perkara: JenisPerkara.perdata,
      status: StatusPerkara.aktif,
      prioritas: 'tinggi',
      tingkat_pengadilan: 'PN',
      nama_pengadilan: 'Pengadilan Negeri Jakarta Selatan',
      posisi_klien: 'Penggugat',
      pihak_lawan: 'PT. ABC Corporation',
      kuasa_hukum_lawan: 'Law Firm XYZ & Partners',
      nilai_perkara: 5000000000,
      tanggal_register: new Date('2024-01-15'),
      tanggal_sidang_pertama: new Date('2024-02-01'),
      nilai_fee: 150000000,
      status_pembayaran: 'Sebagian',
      dibuat_oleh: partner.id,
    },
  });
  console.log('✅ Case 1 created:', perkara1.nomor_perkara);

  const perkara2 = await prisma.perkara.create({
    data: {
      nomor_perkara: 'PKR/2024/002',
      nomor_perkara_pengadilan: '456/Pid.B/2024/PN.Jkt.Pst',
      judul: 'Perkara Pidana Penggelapan',
      deskripsi:
        'Kasus penggelapan dana perusahaan senilai 2.5 Miliar. Klien sebagai terdakwa membutuhkan pembelaan hukum.',
      klien_id: klien2.id,
      jenis_perkara: JenisPerkara.pidana,
      status: StatusPerkara.aktif,
      prioritas: 'mendesak',
      tingkat_pengadilan: 'PN',
      nama_pengadilan: 'Pengadilan Negeri Jakarta Pusat',
      posisi_klien: 'Terdakwa',
      pihak_lawan: 'Jaksa Penuntut Umum',
      nilai_perkara: 2500000000,
      tanggal_register: new Date('2024-02-10'),
      tanggal_sidang_pertama: new Date('2024-03-01'),
      nilai_fee: 100000000,
      status_pembayaran: 'Lunas',
      dibuat_oleh: advokat1.id,
    },
  });
  console.log('✅ Case 2 created:', perkara2.nomor_perkara);

  const perkara3 = await prisma.perkara.create({
    data: {
      nomor_perkara: 'PKR/2024/003',
      nomor_perkara_pengadilan: '789/Pdt.G/2024/PN.Jkt.Pst',
      judul: 'Sengketa Tanah CV. Maju Bersama',
      deskripsi:
        'Sengketa kepemilikan tanah seluas 2000m2 di Jakarta Pusat antara klien dengan pihak ketiga.',
      klien_id: klien3.id,
      jenis_perkara: JenisPerkara.perdata,
      status: StatusPerkara.aktif,
      prioritas: 'sedang',
      tingkat_pengadilan: 'PN',
      nama_pengadilan: 'Pengadilan Negeri Jakarta Pusat',
      posisi_klien: 'Tergugat',
      pihak_lawan: 'Yayasan Pembangunan Indonesia',
      kuasa_hukum_lawan: 'Associates Law Office',
      nilai_perkara: 10000000000,
      tanggal_register: new Date('2024-03-01'),
      tanggal_sidang_pertama: new Date('2024-04-15'),
      nilai_fee: 200000000,
      status_pembayaran: 'Pending',
      dibuat_oleh: advokat2.id,
    },
  });
  console.log('✅ Case 3 created:', perkara3.nomor_perkara);

  // ============================================================
  // STEP 5: CREATE CASE TEAMS
  // ============================================================
  await prisma.timPerkara.createMany({
    data: [
      // Perkara 1 Team (Partner leads)
      {
        perkara_id: perkara1.id,
        user_id: partner.id,
        peran: 'Senior Partner / Lead Counsel',
      },
      {
        perkara_id: perkara1.id,
        user_id: advokat1.id,
        peran: 'Co-Counsel',
      },
      {
        perkara_id: perkara1.id,
        user_id: paralegal.id,
        peran: 'Legal Assistant',
      },
      // Perkara 2 Team
      {
        perkara_id: perkara2.id,
        user_id: advokat1.id,
        peran: 'Lead Counsel',
      },
      {
        perkara_id: perkara2.id,
        user_id: staff.id,
        peran: 'Administrative Support',
      },
      // Perkara 3 Team
      {
        perkara_id: perkara3.id,
        user_id: advokat2.id,
        peran: 'Lead Counsel',
      },
      {
        perkara_id: perkara3.id,
        user_id: paralegal.id,
        peran: 'Legal Research',
      },
    ],
  });
  console.log('✅ Case teams created');

  // ============================================================
  // STEP 6: CREATE TASKS
  // ============================================================
  await prisma.tugas.createMany({
    data: [
      // Perkara 1 Tasks
      {
        perkara_id: perkara1.id,
        judul: 'Draft Surat Gugatan',
        deskripsi:
          'Membuat draft surat gugatan lengkap dengan bukti-bukti dan legal basis',
        ditugaskan_ke: advokat1.id,
        status: StatusTugas.sedang_berjalan,
        prioritas: 'tinggi',
        tenggat_waktu: new Date('2024-01-25'),
        dapat_ditagih: true,
        jam_kerja: 8.5,
        tarif_per_jam: 500000,
        dibuat_oleh: partner.id,
      },
      {
        perkara_id: perkara1.id,
        judul: 'Riset Hukum Wanprestasi',
        deskripsi: 'Melakukan riset putusan-putusan serupa dan yurisprudensi',
        ditugaskan_ke: paralegal.id,
        status: StatusTugas.selesai,
        prioritas: 'sedang',
        tenggat_waktu: new Date('2024-01-20'),
        tanggal_selesai: new Date('2024-01-19'),
        dapat_ditagih: true,
        jam_kerja: 4,
        tarif_per_jam: 300000,
        dibuat_oleh: partner.id,
      },
      // Perkara 2 Tasks
      {
        perkara_id: perkara2.id,
        judul: 'Persiapan Pembelaan',
        deskripsi: 'Menyusun strategi pembelaan dan mengumpulkan bukti alibi',
        ditugaskan_ke: advokat1.id,
        status: StatusTugas.sedang_berjalan,
        prioritas: 'mendesak',
        tenggat_waktu: new Date('2024-02-28'),
        dapat_ditagih: true,
        jam_kerja: 12,
        tarif_per_jam: 600000,
        dibuat_oleh: admin.id,
      },
      {
        perkara_id: perkara2.id,
        judul: 'Administrasi Berkas Perkara',
        deskripsi: 'Mengorganisir dan mengelola berkas perkara pidana',
        ditugaskan_ke: staff.id,
        status: StatusTugas.belum_mulai,
        prioritas: 'sedang',
        tenggat_waktu: new Date('2024-02-25'),
        dapat_ditagih: false,
        dibuat_oleh: admin.id,
      },
      // Perkara 3 Tasks
      {
        perkara_id: perkara3.id,
        judul: 'Verifikasi Dokumen Tanah',
        deskripsi:
          'Melakukan verifikasi sertifikat tanah dan dokumen pendukung di BPN',
        ditugaskan_ke: paralegal.id,
        status: StatusTugas.sedang_berjalan,
        prioritas: 'tinggi',
        tenggat_waktu: new Date('2024-03-20'),
        dapat_ditagih: true,
        jam_kerja: 6,
        tarif_per_jam: 350000,
        dibuat_oleh: advokat2.id,
      },
      {
        perkara_id: perkara3.id,
        judul: 'Penyusunan Eksepsi',
        deskripsi: 'Membuat draft eksepsi untuk dibacakan di sidang pertama',
        ditugaskan_ke: advokat2.id,
        status: StatusTugas.belum_mulai,
        prioritas: 'tinggi',
        tenggat_waktu: new Date('2024-04-10'),
        dapat_ditagih: true,
        jam_kerja: 5,
        tarif_per_jam: 550000,
        dibuat_oleh: advokat2.id,
      },
    ],
  });
  console.log('✅ Sample tasks created');

  // ============================================================
  // STEP 7: CREATE HEARING SCHEDULES
  // ============================================================
  await prisma.jadwalSidang.createMany({
    data: [
      // Perkara 1 Schedules
      {
        perkara_id: perkara1.id,
        jenis_sidang: 'sidang_pertama',
        tanggal_sidang: new Date('2024-02-01'),
        waktu_mulai: '09:00',
        waktu_selesai: '12:00',
        nama_pengadilan: 'Pengadilan Negeri Jakarta Selatan',
        nomor_ruang_sidang: 'Ruang 101',
        nama_hakim: 'Dr. Ahmad Yani, S.H., M.H.',
        agenda_sidang: 'Pembacaan gugatan dan jawaban',
        catatan: 'Harap membawa bukti asli perjanjian',
        dibuat_oleh: partner.id,
      },
      {
        perkara_id: perkara1.id,
        jenis_sidang: 'sidang_pembuktian',
        tanggal_sidang: new Date('2024-03-15'),
        waktu_mulai: '10:00',
        waktu_selesai: '13:00',
        nama_pengadilan: 'Pengadilan Negeri Jakarta Selatan',
        nomor_ruang_sidang: 'Ruang 101',
        nama_hakim: 'Dr. Ahmad Yani, S.H., M.H.',
        agenda_sidang: 'Pembuktian saksi dan dokumen',
        dibuat_oleh: partner.id,
      },
      // Perkara 2 Schedules
      {
        perkara_id: perkara2.id,
        jenis_sidang: 'sidang_pertama',
        tanggal_sidang: new Date('2024-03-01'),
        waktu_mulai: '09:30',
        waktu_selesai: '11:30',
        nama_pengadilan: 'Pengadilan Negeri Jakarta Pusat',
        nomor_ruang_sidang: 'Ruang 203',
        nama_hakim: 'Dra. Siti Nurhaliza, S.H., M.H.',
        agenda_sidang: 'Pembacaan dakwaan',
        catatan: 'Klien wajib hadir',
        dibuat_oleh: advokat1.id,
      },
      {
        perkara_id: perkara2.id,
        jenis_sidang: 'sidang_pembuktian',
        tanggal_sidang: new Date('2024-04-05'),
        waktu_mulai: '09:00',
        waktu_selesai: '12:00',
        nama_pengadilan: 'Pengadilan Negeri Jakarta Pusat',
        nomor_ruang_sidang: 'Ruang 203',
        nama_hakim: 'Dra. Siti Nurhaliza, S.H., M.H.',
        agenda_sidang: 'Pemeriksaan saksi dan bukti',
        dibuat_oleh: advokat1.id,
      },
      // Perkara 3 Schedules
      {
        perkara_id: perkara3.id,
        jenis_sidang: 'sidang_pertama',
        tanggal_sidang: new Date('2024-04-15'),
        waktu_mulai: '10:30',
        waktu_selesai: '12:30',
        nama_pengadilan: 'Pengadilan Negeri Jakarta Pusat',
        nomor_ruang_sidang: 'Ruang 105',
        nama_hakim: 'H. Bambang Supriyanto, S.H., M.H.',
        agenda_sidang: 'Pembacaan gugatan dan eksepsi',
        catatan: 'Siapkan sertifikat asli tanah',
        dibuat_oleh: advokat2.id,
      },
    ],
  });
  console.log('✅ Sample hearing schedules created');

  // ============================================================
  // STEP 8: CREATE CONFLICT CHECKS (NEW!)
  // ============================================================
  await prisma.pemeriksaanKonflik.createMany({
    data: [
      {
        nama_klien: 'PT. Teknologi Nusantara',
        pihak_lawan: 'PT. ABC Corporation',
        ada_konflik: false,
        detail_konflik:
          'Tidak ditemukan konflik kepentingan. PT. ABC belum pernah menjadi klien. Gugatan wanprestasi terkait perjanjian kerja sama bisnis.',
        diperiksa_oleh: partner.id,
        perkara_id: perkara1.id,
        tanggal_periksa: new Date('2024-01-10'),
      },
      {
        nama_klien: 'Ahmad Wijaya',
        pihak_lawan: 'Jaksa Penuntut Umum',
        ada_konflik: false,
        detail_konflik: 'Tidak ada konflik. Kasus pidana dapat diterima. Perkara pidana penggelapan.',
        diperiksa_oleh: paralegal.id,
        perkara_id: perkara2.id,
        tanggal_periksa: new Date('2024-02-05'),
      },
      {
        nama_klien: 'CV. Maju Bersama',
        pihak_lawan: 'Yayasan Pembangunan Indonesia',
        ada_konflik: false,
        detail_konflik:
          'Dilakukan pengecekan menyeluruh. Tidak ada konflik kepentingan. Sengketa kepemilikan tanah.',
        diperiksa_oleh: advokat2.id,
        perkara_id: perkara3.id,
        tanggal_periksa: new Date('2024-02-25'),
      },
      {
        nama_klien: 'PT. XYZ Industries',
        pihak_lawan: 'PT. Teknologi Nusantara',
        ada_konflik: true,
        detail_konflik:
          'KONFLIK TERDETEKSI! PT. Teknologi Nusantara adalah klien aktif kami (Perkara PKR/2024/001). Tidak dapat menerima kasus ini. Sengketa kontrak pengadaan barang.',
        diperiksa_oleh: partner.id,
        tanggal_periksa: new Date('2024-03-10'),
      },
    ],
  });
  console.log('✅ Conflict checks created');

  // ============================================================
  // STEP 9: CREATE DOCUMENTS (NEW!)
  // ============================================================
  await prisma.dokumenHukum.createMany({
    data: [
      // Perkara 1 Documents
      {
        perkara_id: perkara1.id,
        nama_dokumen: 'Surat Gugatan Wanprestasi.pdf',
        kategori: 'gugatan',
        ukuran_file: 524288, // 512 KB
        tipe_file: 'application/pdf',
        nomor_bukti: 'DOC/001/2024',
        tanggal_dokumen: new Date('2024-01-20'),
        catatan: 'Surat gugatan lengkap dengan bukti-bukti',
        file_path: '/storage/dokumen/gugatan-perkara-001.pdf',
        diunggah_oleh: advokat1.id,
      },
      {
        perkara_id: perkara1.id,
        nama_dokumen: 'Perjanjian Kerjasama Asli.pdf',
        kategori: 'kontrak',
        ukuran_file: 1048576, // 1 MB
        tipe_file: 'application/pdf',
        catatan: 'Scan perjanjian asli yang dilanggar',
        file_path: '/storage/dokumen/kontrak-kerjasama.pdf',
        diunggah_oleh: paralegal.id,
      },
      // Perkara 2 Documents
      {
        perkara_id: perkara2.id,
        nama_dokumen: 'Pleidoi Pembelaan.docx',
        kategori: 'lainnya',
        ukuran_file: 204800, // 200 KB
        tipe_file: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        tanggal_dokumen: new Date('2024-02-20'),
        catatan: 'Draft pleidoi untuk sidang pembelaan',
        file_path: '/storage/dokumen/pleidoi-perkara-002.docx',
        diunggah_oleh: advokat1.id,
      },
      {
        perkara_id: perkara2.id,
        nama_dokumen: 'Bukti Alibi - Foto CCTV.jpg',
        kategori: 'bukti',
        ukuran_file: 2097152, // 2 MB
        tipe_file: 'image/jpeg',
        catatan: 'Screenshot CCTV menunjukkan klien di lokasi lain',
        file_path: '/storage/dokumen/cctv-alibi.jpg',
        diunggah_oleh: staff.id,
      },
      // Perkara 3 Documents
      {
        perkara_id: perkara3.id,
        nama_dokumen: 'Sertifikat Hak Milik Tanah.pdf',
        kategori: 'bukti',
        ukuran_file: 3145728, // 3 MB
        tipe_file: 'application/pdf',
        nomor_bukti: 'SHM-12345/2020',
        tanggal_dokumen: new Date('2020-05-15'),
        catatan: 'Scan sertifikat asli atas nama CV. Maju Bersama',
        file_path: '/storage/dokumen/shm-tanah.pdf',
        diunggah_oleh: paralegal.id,
      },
      {
        perkara_id: perkara3.id,
        nama_dokumen: 'Eksepsi Kompetensi Absolut.pdf',
        kategori: 'lainnya',
        ukuran_file: 409600, // 400 KB
        tipe_file: 'application/pdf',
        tanggal_dokumen: new Date('2024-03-25'),
        catatan: 'Eksepsi terkait kewenangan pengadilan',
        file_path: '/storage/dokumen/eksepsi-perkara-003.pdf',
        diunggah_oleh: advokat2.id,
      },
    ],
  });
  console.log('✅ Legal documents created');

  // ============================================================
  // STEP 10: CREATE CLIENT PORTAL ACCESS
  // ============================================================
  await prisma.aksesPortalKlien.create({
    data: {
      klien_id: klien1.id,
      user_id: klienUser.id,
      is_aktif: true,
    },
  });
  console.log('✅ Client portal access created');

  // ============================================================
  // SUMMARY
  // ============================================================
  console.log('\n' + '='.repeat(70));
  console.log('🎉 COMPREHENSIVE DATABASE SEEDING COMPLETED!');
  console.log('='.repeat(70));
  console.log('\n📧 Login Credentials (Password: Admin123!):');
  console.log('   ┌───────────────────────────────────────────────────────────┐');
  console.log('   │ 👑 Admin:     admin@perari.id     (System Admin)          │');
  console.log('   │ 💼 Partner:   partner@perari.id   (Senior Partner) ⭐NEW! │');
  console.log('   │ ⚖️  Advokat 1: advokat@perari.id   (Senior Lawyer)         │');
  console.log('   │ ⚖️  Advokat 2: advokat2@perari.id  (Lawyer)                │');
  console.log('   │ 📝 Paralegal: paralegal@perari.id (Legal Assistant)       │');
  console.log('   │ 📄 Staff:     staff@perari.id     (Admin Staff)           │');
  console.log('   │ 👤 Klien:     klien@perari.id     (Client Portal)         │');
  console.log('   └───────────────────────────────────────────────────────────┘');
  console.log('\n📊 Data Created:');
  console.log('   • 7 Users (Admin, Partner, 2 Advokat, Paralegal, Staff, Klien)');
  console.log('   • 3 Clients (2 Companies, 1 Individual)');
  console.log('   • 3 Cases (2 Civil, 1 Criminal)');
  console.log('   • 7 Case Team Members (across 3 cases)');
  console.log('   • 6 Tasks (2 Active, 1 Completed, 3 Pending)');
  console.log('   • 5 Hearing Schedules (across 3 cases)');
  console.log('   • 4 Conflict Checks (3 Clear, 1 Conflict Detected) ⭐NEW!');
  console.log('   • 6 Legal Documents (PDF, DOCX, JPG) ⭐NEW!');
  console.log('   • 1 Client Portal Access');
  console.log('\n🎯 Test Scenarios Available:');
  console.log('   ✓ Full CRUD operations for all roles');
  console.log('   ✓ PARTNER role testing (senior management access)');
  console.log('   ✓ Multiple case types (civil, criminal)');
  console.log('   ✓ Conflict of interest detection');
  console.log('   ✓ Document management');
  console.log('   ✓ Team collaboration workflows');
  console.log('   ✓ Financial tracking (fees, billing)');
  console.log('\n✨ Database is ready for comprehensive testing!\n');
}

// Helper function to get user IDs
async function getUserIds(): Promise<string[]> {
  const users = await prisma.user.findMany({
    where: {
      email: {
        in: [
          'admin@perari.id',
          'partner@perari.id',
          'advokat@perari.id',
          'advokat2@perari.id',
          'paralegal@perari.id',
          'staff@perari.id',
          'klien@perari.id',
        ],
      },
    },
    select: { id: true },
  });
  return users.map((u) => u.id);
}

main()
  .catch((e) => {
    console.error('\n❌ ERROR SEEDING DATABASE:');
    console.error('─'.repeat(70));
    console.error(e);
    console.error('─'.repeat(70));
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
