import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { getProductImages, addProductImage, updateProductImage, deleteProductImage, setImageAsPrimary } from "../lib/db";

export async function loader({ params }: LoaderFunctionArgs) {
  try {
    const { id } = params;
    
    if (!id) {
      return json({ error: "Product ID is required" }, { status: 400 });
    }

    const productId = parseInt(id);
    if (isNaN(productId)) {
      return json({ error: "Invalid product ID" }, { status: 400 });
    }

    const images = await getProductImages(productId);
    return json({ images });
    
  } catch (error) {
    console.error('Error fetching product images:', error);
    return json({ error: "Failed to fetch product images" }, { status: 500 });
  }
}

export async function action({ request, params }: ActionFunctionArgs) {
  try {
    const { id } = params;
    
    if (!id) {
      return json({ error: "Product ID is required" }, { status: 400 });
    }

    const productId = parseInt(id);
    if (isNaN(productId)) {
      return json({ error: "Invalid product ID" }, { status: 400 });
    }

    const formData = await request.formData();
    const actionType = formData.get("action")?.toString();

    switch (actionType) {
      case "add": {
        const image_url = formData.get("image_url")?.toString();
        const alt_text = formData.get("alt_text")?.toString();
        const sort_order = formData.get("sort_order")?.toString();
        const is_primary = formData.get("is_primary")?.toString() === "true";

        if (!image_url) {
          return json({ error: "Image URL is required" }, { status: 400 });
        }

        const imageData = {
          image_url,
          alt_text: alt_text || undefined,
          sort_order: sort_order ? parseInt(sort_order) : undefined,
          is_primary
        };

        const newImage = await addProductImage(productId, imageData);
        return json({ image: newImage, success: "Image added successfully" });
      }

      case "update": {
        const imageId = formData.get("image_id")?.toString();
        const image_url = formData.get("image_url")?.toString();
        const alt_text = formData.get("alt_text")?.toString();
        const sort_order = formData.get("sort_order")?.toString();
        const is_primary = formData.get("is_primary")?.toString() === "true";

        if (!imageId || isNaN(parseInt(imageId))) {
          return json({ error: "Valid image ID is required" }, { status: 400 });
        }

        const imageData: any = {};
        if (image_url !== undefined) imageData.image_url = image_url;
        if (alt_text !== undefined) imageData.alt_text = alt_text;
        if (sort_order !== undefined) imageData.sort_order = parseInt(sort_order);
        if (is_primary !== undefined) imageData.is_primary = is_primary;

        const updatedImage = await updateProductImage(parseInt(imageId), imageData);
        return json({ image: updatedImage, success: "Image updated successfully" });
      }

      case "delete": {
        const imageId = formData.get("image_id")?.toString();

        if (!imageId || isNaN(parseInt(imageId))) {
          return json({ error: "Valid image ID is required" }, { status: 400 });
        }

        const result = await deleteProductImage(parseInt(imageId));
        if (!result) {
          return json({ error: "Image not found" }, { status: 404 });
        }

        return json({ success: "Image deleted successfully" });
      }

      case "set_primary": {
        const imageId = formData.get("image_id")?.toString();

        if (!imageId || isNaN(parseInt(imageId))) {
          return json({ error: "Valid image ID is required" }, { status: 400 });
        }

        const primaryImage = await setImageAsPrimary(parseInt(imageId));
        return json({ image: primaryImage, success: "Primary image updated" });
      }

      default:
        return json({ error: "Invalid action" }, { status: 400 });
    }
    
  } catch (error) {
    console.error('Error in product images action:', error);
    return json({ error: "Failed to process request" }, { status: 500 });
  }
}