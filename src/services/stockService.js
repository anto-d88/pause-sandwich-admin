import { supabase } from "./supabase";

export async function updateProductStock(productId, newStock) {
  const cleanStock = Math.max(0, Number(newStock || 0));

  const { data, error } = await supabase
    .from("products")
    .update({
      stock_quantity: cleanStock,
    })
    .eq("id", productId)
    .select()
    .single();

  if (error) throw error;

  return data;
}