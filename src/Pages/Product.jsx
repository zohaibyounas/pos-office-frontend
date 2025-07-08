import React, { useEffect, useRef, useState } from "react";
import {
  getProducts,
  addProduct,
  deleteProduct,
  updateProduct,
} from "../api/products";
import { FaEye, FaEdit, FaTrash } from "react-icons/fa";
import axios from "axios";

function Product() {
  const [products, setProducts] = useState([]);
  const [preview, setPreview] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editingProductId, setEditingProductId] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [searchCode, setSearchCode] = useState("");
  // eslint-disable-next-line no-unused-vars
  const [barcodeError, setBarcodeError] = useState("");

  const inputRef = useRef();

  const [formProduct, setFormProduct] = useState({
    name: "",
    code: "",
    brand: "",
    price: "",
    costPrice: "",
    discount: "",
    unit: "",
    stock: "",
    image: "",
    category: "",
    vendor: "",
    Warehouse: "",
  });

  const fetchProducts = () => {
    getProducts()
      .then((res) => {
        if (Array.isArray(res.data)) setProducts(res.data);
        else console.error("Unexpected response:", res.data);
      })
      .catch((err) => console.error("Error fetching products:", err));
  };

  useEffect(() => {
    fetchProducts();
    inputRef.current?.focus();
  }, []);

  const resetForm = () => {
    setFormProduct({
      name: "",
      code: "",
      brand: "",
      price: "",
      costPrice: "",
      discount: "",
      unit: "",
      stock: "",
      image: "",
      category: "",
      vendor: "",
      Warehouse: "",
    });
    setPreview(null);
    setEditingProductId(null);
    setBarcodeError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingProductId) {
      updateProduct(editingProductId, formProduct)
        .then(() => {
          fetchProducts();
          resetForm();
        })
        .catch((err) => console.error("Update error:", err));
    } else {
      addProduct(formProduct)
        .then((res) => {
          setProducts([...products, res.data]);
          resetForm();
        })
        .catch((err) => console.error("Add error:", err));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormProduct({ ...formProduct, image: reader.result });
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleEdit = (product) => {
    setFormProduct(product);
    setPreview(product.image);
    setEditingProductId(product._id);
    setBarcodeError("");
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      deleteProduct(id)
        .then(() => {
          setProducts(products.filter((p) => p._id !== id));
          if (selectedProduct?._id === id) setSelectedProduct(null);
        })
        .catch((err) => console.error("Delete error:", err));
    }
  };

  const calculateDiscountedPrice = (price, discount) => {
    const priceNum = parseFloat(price) || 0;
    const discountNum = parseFloat(discount) || 0;
    return (priceNum - discountNum).toFixed(2);
  };

  // eslint-disable-next-line no-unused-vars
  const fetchProductByBarcode = async (code) => {
    try {
      const res = await axios.get(`/api/products/barcode/${code}`);
      const product = res.data;
      if (product) {
        setFormProduct(product);
        setEditingProductId(product._id);
        setPreview(product.image || null);
        setBarcodeError("");
      }
    } catch (error) {
      console.error("Barcode fetch failed:", error);
      setBarcodeError("Product with this barcode not found. You can add it.");
      resetForm();
      setFormProduct((prev) => ({ ...prev, code }));
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">
        {editingProductId ? "Edit Product" : "Add New Product"}
      </h2>

      {/* Barcode input field */}
      {/* <div className="mb-6">
        <input
          ref={inputRef}
          type="text"
          placeholder="Scan Barcode"
          value={searchCode}
          onChange={(e) => setSearchCode(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              fetchProductByBarcode(searchCode);
              e.preventDefault();
            }
          }}
          className="w-full sm:w-1/3 border border-blue-400 p-2 rounded focus:ring-2 focus:ring-blue-500"
        />
        {barcodeError && (
          <p className="text-red-500 mt-2 text-sm">{barcodeError}</p>
        )}
      </div> */}

      <form
        onSubmit={handleSubmit}
        className="grid sm:grid-cols-2 gap-4 bg-white p-6 rounded-xl shadow-md mb-10"
      >
        {[
          "name",
          "code",
          "brand",
          "price",
          "costPrice",
          "discount",
          "unit",
          "stock",
          "category",
          "vendor",
          "Warehouse",
        ].map((field) => (
          <div key={field} className="relative">
            <input
              className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500"
              placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
              value={formProduct[field]}
              type={
                ["price", "costPrice", "discount", "stock"].includes(field)
                  ? "number"
                  : "text"
              }
              onChange={(e) =>
                setFormProduct({ ...formProduct, [field]: e.target.value })
              }
            />
            {field === "discount" && formProduct.discount && (
              <div className="absolute right-3 top-2 text-sm text-gray-500">
                Final: PKR
                {calculateDiscountedPrice(
                  formProduct.price,
                  formProduct.discount
                )}
              </div>
            )}
          </div>
        ))}

        <div className="col-span-2">
          <label className="block mb-1 font-medium text-gray-700">
            Product Image
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200"
          />
          {preview && (
            <img
              src={preview}
              alt="Preview"
              className="mt-2 h-20 w-20 object-cover rounded border"
            />
          )}
        </div>

        <div className="col-span-2 flex gap-4">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded"
          >
            {editingProductId ? "Update Product" : "Add Product"}
          </button>
          {editingProductId && (
            <button
              type="button"
              onClick={resetForm}
              className="bg-gray-400 hover:bg-gray-500 text-white font-semibold py-2 px-6 rounded"
            >
              Cancel Edit
            </button>
          )}
        </div>
      </form>

      <h2 className="text-2xl font-semibold mb-4 text-gray-700">
        Product List
      </h2>

      <div className="overflow-x-auto bg-white shadow rounded-xl">
        <table className="min-w-full table-auto text-sm text-left border border-gray-200">
          <thead className="bg-gray-100 text-gray-600 font-semibold">
            <tr>
              <th className="px-4 py-3 border">Image</th>
              <th className="px-4 py-3 border">Name</th>
              <th className="px-4 py-3 border">Code</th>
              <th className="px-4 py-3 border">Brand</th>
              <th className="px-4 py-3 border">Price</th>
              <th className="px-4 py-3 border">Cost Price</th>
              <th className="px-4 py-3 border">Discount</th>
              <th className="px-4 py-3 border">Final Price</th>
              <th className="px-4 py-3 border">Unit</th>
              <th className="px-4 py-3 border">Stock</th>
              <th className="px-4 py-3 border">Category</th>
              <th className="px-4 py-3 border">Vendor</th>
              <th className="px-4 py-3 border">Warehouse</th>
              <th className="px-4 py-3 border text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="text-gray-700">
            {products
              .filter((p) =>
                p.code.toLowerCase().includes(searchCode.toLowerCase())
              )
              .map((p) => (
                <tr key={p._id} className="hover:bg-gray-50 transition">
                  <td className="border px-4 py-2">
                    <img
                      src={p.image}
                      alt={p.name}
                      className="w-10 h-10 object-cover rounded"
                    />
                  </td>
                  <td className="border px-4 py-2">{p.name}</td>
                  <td className="border px-4 py-2">{p.code}</td>
                  <td className="border px-4 py-2">{p.brand}</td>
                  <td className="border px-4 py-2">PKR{p.price}</td>
                  <td className="border px-4 py-2">
                    {p.costPrice ? `PKR${p.costPrice}` : "-"}
                  </td>
                  <td className="border px-4 py-2">
                    {p.discount ? `PKR${p.discount}` : "-"}
                  </td>
                  <td className="border px-4 py-2 font-medium">
                    PKR{calculateDiscountedPrice(p.price, p.discount)}
                  </td>
                  <td className="border px-4 py-2">{p.unit}</td>
                  <td className="border px-4 py-2">{p.stock}</td>
                  <td className="border px-4 py-2">{p.category}</td>
                  <td className="border px-4 py-2">{p.vendor}</td>
                  <td className="border px-4 py-2">{p.Warehouse}</td>
                  <td className="px-4 py-2 mt-2 flex justify-center gap-4 text-lg">
                    <button
                      onClick={() =>
                        setSelectedProduct(
                          selectedProduct?._id === p._id ? null : p
                        )
                      }
                      className="text-blue-600 hover:text-blue-800"
                      title={selectedProduct?._id === p._id ? "Hide" : "View"}
                    >
                      <FaEye />
                    </button>
                    <button
                      onClick={() => handleEdit(p)}
                      className="text-green-600 hover:text-green-800"
                      title="Edit"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDelete(p._id)}
                      className="text-red-600 hover:text-red-800"
                      title="Delete"
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {selectedProduct && (
        <div className="mt-10">
          <h3 className="text-xl font-bold mb-4 text-gray-700">
            Selected Product Details
          </h3>
          <table className="table-auto w-full bg-white shadow rounded border text-sm">
            <tbody>
              <tr>
                <td className="border px-4 py-2 font-medium">Image</td>
                <td className="border px-4 py-2">
                  <img
                    src={selectedProduct.image}
                    className="w-20 h-20 object-cover rounded"
                    alt="Selected"
                  />
                </td>
              </tr>
              {Object.entries(selectedProduct)
                .filter(
                  ([key]) => key !== "_id" && key !== "__v" && key !== "image"
                )
                .map(([key, value]) => (
                  <tr key={key}>
                    <td className="border px-4 py-2 font-medium">
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </td>
                    <td className="border px-4 py-2">
                      {["price", "discount", "costPrice"].includes(key)
                        ? `PKR${value || "0"}`
                        : value || "-"}
                      {key === "price" && selectedProduct.discount && (
                        <div className="text-sm text-gray-600 mt-1">
                          Final Price: PKR
                          {calculateDiscountedPrice(
                            selectedProduct.price,
                            selectedProduct.discount
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Product;
