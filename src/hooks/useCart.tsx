import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  // useEffect(() => {
  //   localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
  // }, [cart]);

  const addProduct = async (productId: number) => {
    try {
      // const { data: stock } = await api.get(`/stock/${productId}`);

      const productIndex = cart.findIndex(prd => prd.id === productId);

      if (productIndex < 0) {
        const { data: product } = await api.get(`/products/${productId}`);

        if (!product) {
          throw new Error('Erro na adição do produto');
        }

        const newCart = [
          ...cart,
          {
            ...product,
            amount: 1
          }
        ]

        setCart(newCart);

        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      } else {
        updateProductAmount({ productId, amount: (cart[productIndex].amount + 1) })
      }


    } catch (error) {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productIndex = cart.findIndex(prd => prd.id === productId);

      if(productIndex < 0){
        throw new Error("Erro na remoção do produto");
      }
      const newCart = [...cart.filter(prd => prd.id !== productId)];
      setCart(newCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const productIndex = cart.findIndex(prd => prd.id === productId);

      if(productIndex < 0){
        throw new Error('Erro na alteração de quantidade do produto');
      }

      if (amount < 1) {
        throw new Error('Não é permitido valor inferior a 1.');
      }

      const { data: stock } = await api.get(`/stock/${productId}`);

      if (amount > stock.amount) {
        throw new Error('Quantidade solicitada fora de estoque');
      }
      
      cart[productIndex].amount = amount;

      setCart([...cart]);

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
