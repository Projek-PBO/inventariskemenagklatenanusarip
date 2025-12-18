// API base URL for Firebase Realtime Database
const API_BASE_URL = 'https://inventariskemenagklaten-default-rtdb.firebaseio.com/';

// Helper function to transform Firebase object to array
const firebaseObjectToArray = (firebaseObject) => {
  if (!firebaseObject) return [];
  return Object.keys(firebaseObject).map(key => ({
    id: key,
    ...firebaseObject[key]
  }));
};

// API service functions for Firebase
export const apiService = {
  // Items endpoints
  async getItems() {
    try {
      const response = await fetch(`${API_BASE_URL}/items.json`);
      const data = await response.json();
      // Transform the data before returning
      const itemsArray = firebaseObjectToArray(data);
      return { success: true, data: itemsArray };
    } catch (error) {
      console.error('Error fetching items:', error);
      return { success: false, message: error.message };
    }
  },

  async createItem(itemData) {
    try {
      // Calculate availableQty before sending
      const availableQty = (parseInt(itemData.totalQty) || 0) - (parseInt(itemData.usedQty) || 0);
      const dataToSend = {
        ...itemData,
        availableQty: Math.max(0, availableQty),
        lastUpdate: new Date().toISOString(),
      };

      const response = await fetch(`${API_BASE_URL}/items.json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
      });
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Error creating item:', error);
      return { success: false, message: error.message };
    }
  },

  async updateItem(itemData) {
    try {
      // Recalculate available quantity on update
      const availableQty = (parseInt(itemData.totalQty) || 0) - (parseInt(itemData.usedQty) || 0);
      const dataToUpdate = {
        name: itemData.name,
        status: itemData.status,
        totalQty: itemData.totalQty,
        usedQty: itemData.usedQty,
        availableQty: Math.max(0, availableQty),
        lastUpdate: new Date().toISOString(),
      };

      const response = await fetch(`${API_BASE_URL}/items/${itemData.id}.json`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToUpdate)
      });
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Error updating item:', error);
      return { success: false, message: error.message };
    }
  },

  // Borrowing endpoints
  async borrowItem(borrowData) {
    try {
      // 1. Get the current item state
      const itemResponse = await fetch(`${API_BASE_URL}/items/${borrowData.barang_id}.json`);
      const item = await itemResponse.json();

      if (!item) {
        return { success: false, message: "Item not found." };
      }
      
      const newUsedQty = (parseInt(item.usedQty) || 0) + (parseInt(borrowData.jumlah_pinjam) || 0);
      const newAvailableQty = (parseInt(item.totalQty) || 0) - newUsedQty;

      if (newAvailableQty < 0) {
        return { success: false, message: "Not enough items available to borrow." };
      }

      // 2. Create the borrow record
      const borrowRecord = {
        ...borrowData,
        tanggal_pinjam: new Date().toISOString()
      };
      await fetch(`${API_BASE_URL}/borrowed_items.json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(borrowRecord)
      });

      // 3. Update the item's quantities
      const itemUpdate = {
        usedQty: newUsedQty,
        availableQty: newAvailableQty,
        lastUpdate: new Date().toISOString()
      };
      await fetch(`${API_BASE_URL}/items/${borrowData.barang_id}.json`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemUpdate)
      });

      return { success: true };
    } catch (error) {
      console.error('Error borrowing item:', error);
      return { success: false, message: error.message };
    }
  },

  async getBorrowers(barangId) {
    try {
      const res = await fetch(
        `${API_BASE_URL}/borrowed_items.json?orderBy="barang_id"&equalTo="${barangId}"`
      );
      const data = await res.json();

      // Convert object → array
      const borrowers = data
        ? Object.keys(data).map((key) => ({ id: key, ...data[key] }))
        : [];

      return { success: true, data: borrowers };
    } catch (err) {
      return { success: false, message: err.message };
    }
  },
  
  // Return borrowed item
  async returnItem(peminjaman) {
    try {
      // 1. Get the current item state
      const itemResponse = await fetch(`${API_BASE_URL}/items/${peminjaman.barang_id}.json`);
      const item = await itemResponse.json();

      if (!item) {
        return { success: false, message: "Item not found." };
      }

      const newUsedQty = (parseInt(item.usedQty) || 0) - (parseInt(peminjaman.jumlah_pinjam) || 0);
      const newAvailableQty = (parseInt(item.totalQty) || 0) - newUsedQty;

      // 2. Delete the borrow record
      await fetch(`${API_BASE_URL}/borrowed_items/${peminjaman.id}.json`, {
        method: 'DELETE'
      });
      
      // 3. Update the item's quantities
      const itemUpdate = {
        usedQty: Math.max(0, newUsedQty),
        availableQty: newAvailableQty,
        lastUpdate: new Date().toISOString()
      };
      await fetch(`${API_BASE_URL}/items/${peminjaman.barang_id}.json`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemUpdate)
      });

      return { success: true };
    } catch (error) {
      console.error('Error returning item:', error);
      return { success: false, message: error.message };
    }
  },

  // Status endpoints
  async getStatuses() {
    try {
      const response = await fetch(`${API_BASE_URL}/statuses.json`);
      const data = await response.json();
      const statusesArray = firebaseObjectToArray(data);
      return { success: true, data: statusesArray };
    } catch (error) {
      console.error('Error fetching statuses:', error);
      return { success: false, message: error.message };
    }
  },

  async createStatus(statusData) {
    try {
      const response = await fetch(`${API_BASE_URL}/statuses.json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(statusData)
      });
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Error creating status:', error);
      return { success: false, message: error.message };
    }
  },
  
  async deleteStatus(statusId) {
    try {
      const response = await fetch(`${API_BASE_URL}/statuses/${statusId}.json`, {
        method: 'DELETE'
      });
      return { success: true, message: "Status berhasil dihapus" };
    } catch (error) {
      console.error('Error deleting status:', error);
      return { success: false, message: error.message };
    }
  },

  // Delete item
  async deleteItem(itemId) {
    try {
      const response = await fetch(`${API_BASE_URL}/items/${itemId}.json`, {
        method: 'DELETE'
      });
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Error deleting item:', error);
      return { success: false, message: error.message };
    }
  },

  // Kendaraan endpoints
  async getKendaraan() {
    try {
      const response = await fetch(`${API_BASE_URL}/kendaraan.json`);
      const data = await response.json();
      
      // Jika kendaraan collection belum ada, return array kosong
      // Collection akan dibuat otomatis saat tambah data pertama
      if (!data || data === null) {
        return { success: true, data: [] };
      }
      
      const kendaraanArray = firebaseObjectToArray(data);
      return { success: true, data: kendaraanArray };
    } catch (error) {
      console.error('Error fetching kendaraan:', error);
      return { success: false, message: error.message };
    }
  },

  async addKendaraan(kendaraanData) {
    try {
      const dataToSend = {
        namaKendaraan: kendaraanData.namaKendaraan,
        nomorPlat: kendaraanData.nomorPlat,
        satker: kendaraanData.satker,
        tanggalPajak: kendaraanData.tanggalPajak,
        keterangan: kendaraanData.keterangan,
        createdAt: new Date().toISOString(),
        lastUpdate: new Date().toISOString(),
      };

      console.log('Sending data to Firebase:', dataToSend);
      console.log('URL:', `${API_BASE_URL}/kendaraan.json`);

      const response = await fetch(`${API_BASE_URL}/kendaraan.json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
      });
      
      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);
      
      if (response.ok) {
        return { success: true, data };
      } else {
        return { success: false, message: 'Failed to add kendaraan' };
      }
    } catch (error) {
      console.error('Error adding kendaraan:', error);
      return { success: false, message: error.message };
    }
  },

  async updateKendaraan(kendaraanData) {
    try {
      const dataToUpdate = {
        namaKendaraan: kendaraanData.namaKendaraan,
        nomorPlat: kendaraanData.nomorPlat,
        satker: kendaraanData.satker,
        tanggalPajak: kendaraanData.tanggalPajak,
        keterangan: kendaraanData.keterangan,
        lastUpdate: new Date().toISOString(),
      };

      const response = await fetch(`${API_BASE_URL}/kendaraan/${kendaraanData.id}.json`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToUpdate)
      });
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Error updating kendaraan:', error);
      return { success: false, message: error.message };
    }
  },

  async deleteKendaraan(kendaraanId) {
    try {
      const response = await fetch(`${API_BASE_URL}/kendaraan/${kendaraanId}.json`, {
        method: 'DELETE'
      });
      return { success: true, message: "Kendaraan berhasil dihapus" };
    } catch (error) {
      console.error('Error deleting kendaraan:', error);
      return { success: false, message: error.message };
    }
  },

  // Peminjaman Kendaraan endpoints
  async borrowKendaraan(borrowData) {
    try {
      const dataToSend = {
        kendaraan_id: borrowData.kendaraan_id,
        namaKendaraan: borrowData.namaKendaraan,
        nomorPlat: borrowData.nomorPlat,
        nama_peminjam: borrowData.nama_peminjam,
        keperluan: borrowData.keperluan,
        tanggal_pinjam: new Date().toISOString(),
      };

      const response = await fetch(`${API_BASE_URL}/borrowed_kendaraan.json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
      });
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Error borrowing kendaraan:', error);
      return { success: false, message: error.message };
    }
  },

  async getBorrowersKendaraan(kendaraanId) {
    try {
      // Try with orderBy query first
      let response = await fetch(
        `${API_BASE_URL}/borrowed_kendaraan.json?orderBy="kendaraan_id"&equalTo="${kendaraanId}"`
      );
      let data = await response.json();
      
      // If query fails (indexing not set), fetch all and filter manually
      if (data && data.error) {
        console.log('Index not found, fetching all data...');
        response = await fetch(`${API_BASE_URL}/borrowed_kendaraan.json`);
        data = await response.json();
        
        // Filter manually
        if (data) {
          const filtered = {};
          Object.keys(data).forEach(key => {
            if (data[key].kendaraan_id === kendaraanId) {
              filtered[key] = data[key];
            }
          });
          data = filtered;
        }
      }
      
      const borrowers = data
        ? Object.keys(data).map((key) => ({ id: key, ...data[key] }))
        : [];
      
      console.log(`Found ${borrowers.length} borrowers for kendaraan ${kendaraanId}`);
      return { success: true, data: borrowers };
    } catch (error) {
      console.error('Error fetching borrowers kendaraan:', error);
      return { success: false, message: error.message };
    }
  },

  async returnKendaraan(borrowId) {
    try {
      const response = await fetch(`${API_BASE_URL}/borrowed_kendaraan/${borrowId}.json`, {
        method: 'DELETE'
      });
      return { success: true, message: "Kendaraan berhasil dikembalikan" };
    } catch (error) {
      console.error('Error returning kendaraan:', error);
      return { success: false, message: error.message };
    }
  }

};
