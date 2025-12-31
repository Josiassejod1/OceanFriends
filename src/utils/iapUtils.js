import * as IAP from 'expo-iap';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Product IDs - These need to be configured in App Store Connect and Google Play Console
const PRODUCT_IDS = {
  UNLOCK_ALL: 'unlock_all_boards', // Product ID for unlocking all boards
  // Individual board IDs can be generated dynamically if needed
};

const PURCHASE_STORAGE_KEY = '@purchases';

let isConnected = false;

/**
 * Initialize IAP connection
 */
export async function initializeIAP() {
  try {
    // Check if IAP is available
    const available = await IAP.isAvailableAsync();
    if (!available) {
      console.warn('In-app purchases are not available on this device');
      return false;
    }

    // Connect to store
    await IAP.connectAsync();
    isConnected = true;
    return true;
  } catch (error) {
    console.error('Error initializing IAP:', error);
    isConnected = false;
    return false;
  }
}

/**
 * Disconnect from IAP
 */
export async function disconnectIAP() {
  try {
    if (isConnected) {
      await IAP.disconnectAsync();
      isConnected = false;
    }
  } catch (error) {
    console.error('Error disconnecting IAP:', error);
  }
}

/**
 * Get available products from the store
 */
export async function getProducts() {
  try {
    if (!isConnected) {
      await initializeIAP();
    }
    
    const products = await IAP.getProductsAsync({
      skus: [PRODUCT_IDS.UNLOCK_ALL],
    });
    
    return products || [];
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

/**
 * Purchase unlock all boards
 */
export async function purchaseUnlockAll() {
  try {
    if (!isConnected) {
      const connected = await initializeIAP();
      if (!connected) {
        return { success: false, error: 'Could not connect to store' };
      }
    }

    // Get products first to ensure they're available
    const products = await getProducts();
    const unlockAllProduct = products.find(p => p.productId === PRODUCT_IDS.UNLOCK_ALL);
    
    if (!unlockAllProduct) {
      throw new Error('Unlock All product not found in store');
    }

    // Initiate purchase
    const purchase = await IAP.purchaseItemAsync({
      sku: PRODUCT_IDS.UNLOCK_ALL,
    });
    
    if (purchase && purchase.transactionReceipt) {
      // Purchase successful - save to storage
      await savePurchase(PRODUCT_IDS.UNLOCK_ALL);
      return { success: true, purchase };
    } else {
      return { success: false, error: 'Purchase was cancelled or failed' };
    }
  } catch (error) {
    console.error('Error purchasing unlock all:', error);
    
    // Handle user cancellation gracefully
    if (error.code === 'E_USER_CANCELLED' || error.message?.includes('cancelled')) {
      return { success: false, error: 'Purchase was cancelled' };
    }
    
    return { success: false, error: error.message || 'Purchase failed' };
  }
}

/**
 * Restore previous purchases
 */
export async function restorePurchases() {
  try {
    if (!isConnected) {
      const connected = await initializeIAP();
      if (!connected) {
        return { success: false, error: 'Could not connect to store' };
      }
    }

    const purchases = await IAP.getPurchaseHistoryAsync();
    
    if (purchases && purchases.length > 0) {
      // Restore all purchases
      let restoredCount = 0;
      for (const purchase of purchases) {
        if (purchase.productId === PRODUCT_IDS.UNLOCK_ALL) {
          await savePurchase(PRODUCT_IDS.UNLOCK_ALL);
          restoredCount++;
        }
      }
      return { success: true, restored: restoredCount };
    }
    
    return { success: true, restored: 0 };
  } catch (error) {
    console.error('Error restoring purchases:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Check if unlock all has been purchased
 */
export async function hasUnlockedAll() {
  try {
    const purchases = await AsyncStorage.getItem(PURCHASE_STORAGE_KEY);
    if (purchases) {
      const purchaseList = JSON.parse(purchases);
      return purchaseList.includes(PRODUCT_IDS.UNLOCK_ALL);
    }
    return false;
  } catch (error) {
    console.error('Error checking unlock status:', error);
    return false;
  }
}

/**
 * Save purchase to local storage
 */
async function savePurchase(productId) {
  try {
    const existing = await AsyncStorage.getItem(PURCHASE_STORAGE_KEY);
    const purchases = existing ? JSON.parse(existing) : [];
    
    if (!purchases.includes(productId)) {
      purchases.push(productId);
      await AsyncStorage.setItem(PURCHASE_STORAGE_KEY, JSON.stringify(purchases));
    }
  } catch (error) {
    console.error('Error saving purchase:', error);
    throw error;
  }
}

/**
 * Get purchase info (price, etc.)
 */
export async function getPurchaseInfo() {
  try {
    if (!isConnected) {
      await initializeIAP();
    }
    
    const products = await getProducts();
    const unlockAllProduct = products.find(p => p.productId === PRODUCT_IDS.UNLOCK_ALL);
    
    if (unlockAllProduct) {
      return {
        price: unlockAllProduct.price,
        currency: unlockAllProduct.currency,
        title: unlockAllProduct.title,
        description: unlockAllProduct.description,
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting purchase info:', error);
    return null;
  }
}

