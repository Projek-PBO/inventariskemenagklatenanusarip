import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Search, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/apiServices';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import 'jspdf-autotable';


function DataBarang() {
  const navigate = useNavigate(); 
  const dropdownRef = useRef(null);
  const [activeMenu, setActiveMenu] = useState('data');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPinjamModal, setShowPinjamModal] = useState(false);
  const [showPeminjamModal, setShowPeminjamModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [openMenu, setOpenMenu] = React.useState(false);


  //Backup Data
  // Ganti fungsi handleBackupPDF dengan ini:
// Ganti fungsi handleBackupPDF dengan ini:
const handleBackupPDF = async () => {
  const doc = new jsPDF();

  // === HALAMAN 1: TABEL BARANG ===
  // Judul
  doc.setFontSize(16);
  doc.text("Laporan Data Barang Inventaris", 14, 20);

  // Tanggal backup
  doc.setFontSize(10);
  doc.text(`Tanggal: ${new Date().toLocaleDateString("id-ID")}`, 14, 28);

  // Tabel Barang
  const tableColumn = [
    "Nama Barang",
    "Status",
    "Total",
    "Tersedia",
    "Digunakan",
    "Update Terakhir",
  ];

  

  const tableRows = filteredInventory.map((item) => [
    item.name,
    item.status,
    item.totalQty,
    item.availableQty,
    item.usedQty,
    new Date(item.lastUpdate).toLocaleDateString("id-ID"),
  ]);

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 35,
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
  });

  // === HALAMAN 2: TABEL PEMINJAM ===
  // Tambah halaman baru
  doc.addPage();
  
  // Judul halaman peminjam
  doc.setFontSize(16);
  doc.text("Daftar Peminjam Barang", 14, 20);
  
  doc.setFontSize(10);
  doc.text(`Tanggal: ${new Date().toLocaleDateString("id-ID")}`, 14, 28);

  // Load semua data peminjam
  const allBorrowers = [];
  for (const item of filteredInventory) {
    const borrowersResponse = await apiService.getBorrowers(item.id);
    if (borrowersResponse.success && borrowersResponse.data.length > 0) {
      borrowersResponse.data.forEach(borrower => {
        allBorrowers.push({
          namaPeminjam: borrower.nama_peminjam,
          namaBarang: item.name,
          tanggal: borrower.tanggal_pinjam 
            ? new Date(borrower.tanggal_pinjam).toLocaleDateString("id-ID")
            : '-',
          jumlah: borrower.jumlah_pinjam,
          suratPinjam: borrower.surat_pinjam
        });
      });
    }
  }

  // Tabel Peminjam
  const borrowerColumns = [
    "Nama Peminjam",
    "Barang",
    "Tanggal Pinjam",
    "Jumlah",
    "No. Surat"
  ];

  const borrowerRows = allBorrowers.map((borrower) => [
    borrower.namaPeminjam,
    borrower.namaBarang,
    borrower.tanggal,
    borrower.jumlah,
    borrower.suratPinjam
  ]);

  autoTable(doc, {
    head: [borrowerColumns],
    body: borrowerRows.length > 0 ? borrowerRows : [['Tidak ada peminjam saat ini', '', '', '', '']],
    startY: 35,
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [34, 197, 94], // Warna hijau
      textColor: 255,
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 40 }, // Nama Peminjam
      1: { cellWidth: 45 }, // Barang
      2: { cellWidth: 30, halign: 'center' }, // Tanggal
      3: { cellWidth: 20, halign: 'center' }, // Jumlah
      4: { cellWidth: 35 }, // No. Surat
    },
  });

  // Total peminjam
  if (allBorrowers.length > 0) {
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text(`Total Peminjam: ${allBorrowers.length}`, 14, finalY);
  }

  // Simpan PDF
  doc.save(`backup_inventaris_${new Date().toISOString().slice(0, 10)}.pdf`);
};


  
  // Data states
  const [inventory, setInventory] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [borrowers, setBorrowers] = useState([]);
  
  // Form data
  const [pinjamData, setPinjamData] = useState({
    namaPeminjam: '',
    suratPinjam: '',
    jumlahPinjam: 1
  });

  // Load initial data
  useEffect(() => {
    loadItems();
    loadStatuses();
  }, []);

  // Load items from API
  const loadItems = async () => {
    setLoading(true);
    try {
      const response = await apiService.getItems();
      if (response.success) {
        setInventory(response.data);
      } else {
        setError(response.message || 'Failed to load items');
      }
    } catch (err) {
      setError('Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  // Load statuses from API
  const loadStatuses = async () => {
    try {
      const response = await apiService.getStatuses();
      if (response.success) {
        setStatuses(response.data);
      }
    } catch (err) {
      console.error('Error loading statuses:', err);
    }
  };

  // Load borrowers for specific item
const loadBorrowers = async (barangId) => {
  try {
    const response = await apiService.getBorrowers(barangId);
    console.log("Response Borrowers:", response); // cek isi di sini
    if (response.success) {
      setBorrowers(response.data);
    }
  } catch (err) {
    console.error("Error loading borrowers:", err);
  }
};


  // Effect untuk menutup dropdown saat klik di luar
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fungsi untuk mendapatkan warna status
  const getStatusColor = (statusName) => {
    const status = statuses.find(s => s.name === statusName);
    return status ? status.color : 'bg-gray-100 text-gray-800';
  };

  // Filter inventory berdasarkan search dan status
  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Fungsi untuk menangani dropdown
  const handleDropdownAction = (action, item) => {
    if (action === 'pinjam') {
      setSelectedItem(item);
      setShowPinjamModal(true);
    } else if (action === 'edit') {
      setEditingItem({ ...item });
      setShowEditModal(true);
    } else if (action === 'delete') {
      if (window.confirm(`Apakah Anda yakin ingin menghapus barang "${item.name}"?`)) {
        handleDeleteItem(item.id);
      }
    }
    setOpenDropdown(null);
  };

  // Tambahkan fungsi ini sebelum return
  const handleDeleteItem = async (itemId) => {
    setLoading(true);
    try {
      const response = await apiService.deleteItem(itemId);
      if (response.success) {
        alert('Barang berhasil dihapus!');
        await loadItems(); // Refresh data
      } else {
        alert('Gagal menghapus barang: ' + response.message);
      }
    } catch (err) {
      alert('Error menghapus barang: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fungsi untuk melihat peminjam
  const handleLihatPeminjam = async (item) => {
    setSelectedItem(item);
    await loadBorrowers(item.id);
    setShowPeminjamModal(true);
  };

  // Handle update item
  const handleUpdateItem = async () => {
    if (!editingItem) return;

    setLoading(true);
    try {
      const updateData = {
        id: editingItem.id,
        name: editingItem.name,
        status: editingItem.status,
        totalQty: editingItem.totalQty,
        usedQty: editingItem.usedQty
      };

      const response = await apiService.updateItem(updateData);
      if (response.success) {
        alert('Update berhasil!');
        setShowEditModal(false);
        setEditingItem(null);
        await loadItems(); // Reload data
      } else {
        alert('Error: ' + response.message);
      }
    } catch (err) {
      alert('Error updating item: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle borrow item
  // Handle borrow item
  const handleBorrowItem = async () => {
    if (!selectedItem || !pinjamData.namaPeminjam || !pinjamData.suratPinjam) {
      alert('Mohon lengkapi semua field');
      return;
    }

    setLoading(true);
    try {
      const borrowRequest = {
        barang_id: selectedItem.id,
        nama_peminjam: pinjamData.namaPeminjam,
        surat_pinjam: pinjamData.suratPinjam,
        jumlah_pinjam: pinjamData.jumlahPinjam,
        tanggal_pinjam: new Date().toISOString() // atau Date.now()

      };

      const response = await apiService.borrowItem(borrowRequest);
      if (response.success) {
        alert(`Barang berhasil dipinjam oleh ${pinjamData.namaPeminjam}!`);
        setShowPinjamModal(false);
        setSelectedItem(null);
        setPinjamData({ namaPeminjam: '', suratPinjam: '', jumlahPinjam: 1 });
        await loadItems(); // Reload data
      } else {
        alert('Error: ' + response.message);
      }
    } catch (err) {
      alert('Error borrowing item: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle return item
  const handleReturnItem = async (peminjam) => {
    const confirmMessage = `Apakah Anda yakin ingin mengembalikan barang yang dipinjam oleh ${peminjam.nama_peminjam}?\n\nJumlah: ${peminjam.jumlah_pinjam}\nNo. Surat: ${peminjam.surat_pinjam}`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.returnItem(peminjam);
      if (response.success) {
        alert(`Barang berhasil dikembalikan oleh ${peminjam.nama_peminjam}!`);
        // Refresh data
        await loadItems();
        await loadBorrowers(selectedItem.id);
      } else {
        alert('Error: ' + response.message);
      }
    } catch (err) {
      alert('Error returning item: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && inventory.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error && inventory.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadItems}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex justify-between items-center h-16">
      {/* Kiri: Judul */}
      <div className="flex-shrink-0 flex items-center">
        <h1 className="text-xl font-bold text-gray-900">Inventaris Kantor</h1>
      </div>

      {/* Tombol Menu Desktop */}
      <div className="hidden sm:flex sm:space-x-8">
        <button
          onClick={() => setActiveMenu('data')}
          className={`${activeMenu === 'data' 
            ? 'border-green-500 text-gray-900' 
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200`}
        >
          Data Barang
        </button>
        <button
          onClick={() => navigate('/inputbarang')}
          className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200"
        >
          Input Barang
        </button>
        <button
          onClick={() => navigate('/kendaraan')}
          className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200"
        >
          Kendaraan
        </button>
      </div>

      {/* Tombol Hamburger Mobile */}
      <div className="sm:hidden flex items-center">
        <button
          onClick={() => setOpenMenu(!openMenu)}
          className="text-gray-700 text-2xl"
        >
          {openMenu ? '✖' : '☰'}
        </button>
      </div>
    </div>
  </div>

  {/* Dropdown Mobile */}
  {openMenu && (
    <div className="sm:hidden px-4 pb-3 space-y-2 border-t">
      <button
        onClick={() => {
          setActiveMenu('data');
          setOpenMenu(false);
        }}
        className={`block w-full text-left ${
          activeMenu === 'data'
            ? 'text-green-600 font-semibold'
            : 'text-gray-700 hover:text-green-600'
        } py-2`}
      >
        Data Barang
      </button>
      <button
        onClick={() => {
          navigate('/inputbarang');
          setOpenMenu(false);
        }}
        className="block w-full text-left text-gray-700 hover:text-green-600 py-2"
      >
        Input Barang
      </button>
      <button
        onClick={() => {
          navigate('/kendaraan');
          setOpenMenu(false);
        }}
        className="block w-full text-left text-gray-700 hover:text-green-600 py-2"
      >
        Kendaraan
      </button>
    </div>
  )}
</nav>


      {/* Content */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="sm:flex sm:items-center sm:justify-between mb-6">
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Daftar Inventaris Kantor
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Kelola dan pantau status barang kantor
                  </p>
                </div>
              </div>

              {/* Search and Filter */}
              <div className="mb-4 flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleBackupPDF}
                  className="inline-flex items-center px-5 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition duration-200"
                >
                  📄 Backup PDF
                </button>

                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Cari nama barang..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  />
                </div>
                <div className="relative">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md"
                  >
                    <option value="all">Semua Status</option>
                    {statuses.map((status) => (
                      <option key={status.id} value={status.name}>{status.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nama Barang
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status Barang
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total Jumlah
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Jumlah Tersedia
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Jumlah Digunakan
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tanggal Update
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Aksi
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredInventory.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.totalQty}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span className="font-medium text-green-600">
                              {item.availableQty}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span className="font-medium text-orange-600">
                              {item.usedQty}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(item.lastUpdate).toLocaleDateString('id-ID')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center gap-2">
                              {/* Dropdown Aksi */}
                              <div className="relative">
                                <button
                                  onClick={() => setOpenDropdown(openDropdown === item.id ? null : item.id)}
                                  className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                >
                                  Aksi
                                  <ChevronDown className="ml-1 h-4 w-4" />
                                </button>
                                
                                {openDropdown === item.id && (
                                  <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                                    <div className="py-1">
                                      <button
                                        onClick={() => handleDropdownAction('pinjam', item)}
                                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        disabled={item.availableQty === 0}
                                      >
                                        Pinjam Barang
                                      </button>
                                      <button
                                        onClick={() => handleDropdownAction('edit', item)}
                                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                      >
                                        Ubah Jumlah Total
                                      </button>
                                      <button
                                        onClick={() => handleDropdownAction('delete', item)}
                                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                      >
                                        Hapus barang
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                              
                              {/* Tombol Lihat Peminjam */}
                              <button
                                onClick={() => handleLihatPeminjam(item)}
                                className="inline-flex items-center p-1 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                title="Lihat Daftar Peminjam"
                              >
                                <Users className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {filteredInventory.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">Tidak ada barang yang ditemukan</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Edit - Ubah Jumlah Total */}
      {showEditModal && editingItem && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Ubah Jumlah Total: {editingItem.name}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Status Barang
                  </label>
                  <select
                    value={editingItem.status}
                    onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm px-3 py-2 border"
                  >
                    {statuses.map((status) => (
                      <option key={status.id} value={status.name}>{status.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Total Jumlah Barang
                  </label>
                  <input
                    type="number"
                    value={editingItem.totalQty}
                    onChange={(e) => setEditingItem({ 
                      ...editingItem, 
                      totalQty: parseInt(e.target.value) || 0 
                    })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm px-3 py-2 border"
                    min="0"
                  />
                </div>
                
                {/* Info Current */}
                <div className="bg-gray-50 p-3 rounded-md">
                  <div className="text-sm">
                    <span className="font-medium text-gray-700">Saat ini:</span>
                    <div className="mt-1 space-y-1">
                      <div><span className="text-gray-600">Sedang Digunakan: </span><span className="font-medium text-orange-600">{editingItem.usedQty}</span></div>
                      <div><span className="text-gray-600">Akan Tersedia: </span><span className="font-medium text-green-600">
                        {Math.max(editingItem.totalQty - editingItem.usedQty, 0)}
                      </span></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <button
                  onClick={handleUpdateItem}
                  disabled={loading}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors duration-200 disabled:opacity-50"
                >
                  {loading ? 'Updating...' : 'Update'}
                </button>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingItem(null);
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors duration-200"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Pinjam Barang */}
      {showPinjamModal && selectedItem && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Pinjam Barang: {selectedItem.name}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Nama Peminjam
                  </label>
                  <input
                    type="text"
                    value={pinjamData.namaPeminjam}
                    onChange={(e) => setPinjamData({ ...pinjamData, namaPeminjam: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm px-3 py-2 border"
                    placeholder="Masukkan nama peminjam"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Nomor Surat Pinjaman
                  </label>
                  <input
                    type="text"
                    value={pinjamData.suratPinjam}
                    onChange={(e) => setPinjamData({ ...pinjamData, suratPinjam: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm px-3 py-2 border"
                    placeholder="Contoh: SP-001/2024"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Jumlah Pinjam
                  </label>
                  <input
                    type="number"
                    value={pinjamData.jumlahPinjam}
                    onChange={(e) => setPinjamData({ ...pinjamData, jumlahPinjam: parseInt(e.target.value) || 1 })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm px-3 py-2 border"
                    min="1"
                    max={selectedItem.availableQty}
                  />
                </div>
                
                {/* Info Barang */}
                <div className="bg-green-50 p-3 rounded-md">
                  <div className="text-sm">
                    <span className="font-medium text-gray-700">Informasi Barang:</span>
                    <div className="mt-1 space-y-1">
                      <div><span className="text-gray-600">Tersedia: </span><span className="font-medium text-green-600">{selectedItem.availableQty}</span></div>
                      <div><span className="text-gray-600">Sedang Digunakan: </span><span className="font-medium text-orange-600">{selectedItem.usedQty}</span></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <button
                  onClick={handleBorrowItem}
                  disabled={loading}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors duration-200 disabled:opacity-50"
                >
                  {loading ? 'Submitting...' : 'Submit'}
                </button>
                <button
                  onClick={() => {
                    setShowPinjamModal(false);
                    setSelectedItem(null);
                    setPinjamData({ namaPeminjam: '', suratPinjam: '', jumlahPinjam: 1 });
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors duration-200"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Lihat Peminjam */}
      {showPeminjamModal && selectedItem && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Daftar Peminjam: {selectedItem.name}
              </h3>
              
              {borrowers.length > 0 ? (
                <div className="overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nama Peminjam
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          No. Surat
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tanggal Pinjam
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Jumlah
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Aksi
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {borrowers.map((peminjam, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {peminjam.nama_peminjam}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {peminjam.surat_pinjam}
                          </td>
<td>
  {peminjam.tanggal_pinjam
    ? new Date(peminjam.tanggal_pinjam).toLocaleDateString('id-ID')
    : '-'}
</td>

                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {peminjam.jumlah_pinjam}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleReturnItem(peminjam)}
                              disabled={loading}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 transition-colors duration-200"
                            >
                              {loading ? 'Processing...' : 'Kembalikan'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Tidak ada peminjam</h3>
                  <p className="mt-1 text-sm text-gray-500">Barang ini belum dipinjam oleh siapapun.</p>
                </div>
              )}
              
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => {
                    setShowPeminjamModal(false);
                    setSelectedItem(null);
                    setBorrowers([]);
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors duration-200"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


export default DataBarang;
