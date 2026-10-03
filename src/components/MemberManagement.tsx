import React, { useState } from 'react';
import { Member, AttendanceSettings } from '../types';
import { BarcodeRenderer } from './BarcodeRenderer';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  CreditCard,
  Printer,
  Edit2,
  Trash2,
  CheckCircle,
  Sparkles,
  Phone,
  Mail,
  X,
  Plus
} from 'lucide-react';

interface MemberManagementProps {
  members: Member[];
  settings: AttendanceSettings;
  onAddMember: (newMember: Member) => void;
  onUpdateMember: (updatedMember: Member) => void;
  onDeleteMember: (id: string) => void;
  onSelectMemberForKta: (member: Member) => void;
  onQuickScanMember: (ktaNumber: string) => void;
}

export const MemberManagement: React.FC<MemberManagementProps> = ({
  members,
  settings,
  onAddMember,
  onUpdateMember,
  onDeleteMember,
  onSelectMemberForKta,
  onQuickScanMember,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDivision, setSelectedDivision] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    division: 'Divisi Pendampingan & Usaha',
    phone: '',
    email: '',
    bloodType: 'O',
    emergencyContact: '',
    avatar: '/src/assets/images/avatar_member_male1_1790999236469.jpg',
  });

  // Extract unique divisions
  const divisions = ['all', ...Array.from(new Set(members.map((m) => m.division)))];

  // Filter members
  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.ktaNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDivision = selectedDivision === 'all' || m.division === selectedDivision;
    return matchesSearch && matchesDivision;
  });

  // Generate next KTA Number
  const getNextKtaNumber = () => {
    const year = new Date().getFullYear();
    const count = members.length + 1;
    return `KTA-${year}-${String(count).padStart(3, '0')}`;
  };

  const handleOpenAddModal = () => {
    setFormData({
      name: '',
      role: '',
      division: 'Divisi Pendampingan & Usaha',
      phone: '',
      email: '',
      bloodType: 'O',
      emergencyContact: '',
      avatar: '/src/assets/images/avatar_member_male1_1790999236469.jpg',
    });
    setEditingMember(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (member: Member) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      role: member.role,
      division: member.division,
      phone: member.phone,
      email: member.email,
      bloodType: member.bloodType || 'O',
      emergencyContact: member.emergencyContact || '',
      avatar: member.avatar,
    });
    setIsAddModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.role.trim()) return;

    if (editingMember) {
      const updated: Member = {
        ...editingMember,
        name: formData.name,
        role: formData.role,
        division: formData.division,
        phone: formData.phone,
        email: formData.email,
        bloodType: formData.bloodType,
        emergencyContact: formData.emergencyContact,
        avatar: formData.avatar,
      };
      onUpdateMember(updated);
    } else {
      const newMember: Member = {
        id: `mem-${Date.now()}`,
        ktaNumber: getNextKtaNumber(),
        name: formData.name,
        role: formData.role,
        division: formData.division,
        organization: settings.organizationName,
        phone: formData.phone || '0812-0000-0000',
        email: formData.email || `${formData.name.toLowerCase().replace(/\s+/g, '.')}@pendamping.kop.id`,
        joinDate: new Date().toISOString().split('T')[0],
        status: 'aktif',
        bloodType: formData.bloodType,
        emergencyContact: formData.emergencyContact,
        avatar: formData.avatar,
      };
      onAddMember(newMember);
    }

    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">
            Data Anggota & Manajemen KTA Barcode
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola data staf dan anggota, cetak kartu KTA resmi, dan pantau barcode keanggotaan
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition-colors shadow-xs"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah Anggota & KTA Baru</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama, nomor KTA, jabatan..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
          />
        </div>

        {/* Division Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          <span className="text-xs text-slate-500 font-medium mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Divisi:
          </span>
          {divisions.map((div) => (
            <button
              key={div}
              onClick={() => setSelectedDivision(div)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                selectedDivision === div
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {div === 'all' ? 'Semua Divisi' : div.replace('Divisi ', '')}
            </button>
          ))}
        </div>
      </div>

      {/* Member Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMembers.map((member) => (
          <div
            key={member.id}
            className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
          >
            <div>
              {/* Member Card Top */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className="w-12 h-14 rounded-lg object-cover border border-slate-200 bg-slate-100 shrink-0"
                  />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight leading-snug">
                      {member.name}
                    </h3>
                    <p className="text-xs text-slate-600 font-medium">{member.role}</p>
                    <p className="text-[11px] text-slate-400">{member.division}</p>
                  </div>
                </div>

                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  {member.ktaNumber}
                </span>
              </div>

              {/* Barcode Display in Card */}
              <div className="mt-3.5 pt-3 border-t border-slate-100 bg-slate-50/70 p-2 rounded-lg flex flex-col items-center justify-center">
                <BarcodeRenderer
                  value={member.ktaNumber}
                  width={1.2}
                  height={24}
                  displayValue={false}
                  fontSize={10}
                />
                <span className="text-[9px] font-mono text-slate-500 tracking-wider mt-0.5">
                  BARCODE SCANNER ID
                </span>
              </div>

              {/* Contact info */}
              <div className="mt-3 space-y-1 text-[11px] text-slate-500">
                <div className="flex items-center gap-1.5 truncate">
                  <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                  <span>{member.phone}</span>
                </div>
                <div className="flex items-center gap-1.5 truncate">
                  <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                  <span>{member.email}</span>
                </div>
              </div>
            </div>

            {/* Actions Bottom Bar */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                onClick={() => onSelectMemberForKta(member)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                title="Lihat & Cetak Kartu KTA"
              >
                <CreditCard className="w-3.5 h-3.5 text-slate-600" />
                <span>Kartu KTA</span>
              </button>

              <button
                onClick={() => onQuickScanMember(member.ktaNumber)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                title="Simulasi scan presensi dengan barcode ini"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Scan</span>
              </button>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleOpenEditModal(member)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Edit Data"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Yakin ingin menghapus anggota ${member.name}?`)) {
                      onDeleteMember(member.id);
                    }
                  }}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Hapus Anggota"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredMembers.length === 0 && (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-xl">
          <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700">Tidak ada anggota ditemukan</p>
          <p className="text-xs text-slate-400 mt-1">
            Ubah kata kunci pencarian atau tambah anggota baru.
          </p>
        </div>
      )}

      {/* Add / Edit Member Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden my-6">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h2 className="text-sm font-semibold text-slate-900">
                {editingMember ? 'Edit Data Anggota & KTA' : 'Tambah Anggota Baru (KTA Barcode)'}
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap & Gelar *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Budi Santoso, S.E."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jabatan *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    placeholder="Contoh: Pendamping Koperasi"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Divisi *
                  </label>
                  <select
                    value={formData.division}
                    onChange={(e) => setFormData({ ...formData, division: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                  >
                    <option value="Divisi Pendampingan & Usaha">Divisi Pendampingan & Usaha</option>
                    <option value="Divisi Keuangan & Pembukuan">Divisi Keuangan & Pembukuan</option>
                    <option value="Divisi Operasional & IT">Divisi Operasional & IT</option>
                    <option value="Divisi Layanan Anggota">Divisi Layanan Anggota</option>
                    <option value="Pengurus / Manajemen">Pengurus / Manajemen</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nomor WhatsApp / HP
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="0812-xxxx-xxxx"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Resmi
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="nama@pendamping.kop.id"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Golongan Darah
                  </label>
                  <select
                    value={formData.bloodType}
                    onChange={(e) => setFormData({ ...formData, bloodType: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="AB">AB</option>
                    <option value="O">O</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kontak Darurat
                  </label>
                  <input
                    type="text"
                    value={formData.emergencyContact}
                    onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                    placeholder="0813-xxxx-xxxx (Keluarga)"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              {/* Photo Avatar Preset Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Pilih Foto Profil KTA
                </label>
                <div className="flex items-center gap-3">
                  {[
                    '/src/assets/images/avatar_member_male1_1790999236469.jpg',
                    '/src/assets/images/avatar_member_female1_1790999250975.jpg',
                    '/src/assets/images/avatar_member_male2_1790999263071.jpg',
                  ].map((imgUrl, i) => (
                    <button
                      type="button"
                      key={i}
                      onClick={() => setFormData({ ...formData, avatar: imgUrl })}
                      className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                        formData.avatar === imgUrl
                          ? 'border-emerald-600 scale-105 shadow-md'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <img src={imgUrl} alt="Avatar Preset" className="w-12 h-14 object-cover" />
                      {formData.avatar === imgUrl && (
                        <div className="absolute top-1 right-1 w-3.5 h-3.5 bg-emerald-600 rounded-full flex items-center justify-center text-white">
                          <CheckCircle className="w-2.5 h-2.5" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition-colors shadow-xs"
                >
                  {editingMember ? 'Simpan Perubahan' : 'Terbitkan KTA Baru'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
