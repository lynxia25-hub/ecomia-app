export default function StoresPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Mis Tiendas</h1>
      <div className="bg-white dark:bg-gray-900 rounded-xl p-8 text-center border border-dashed border-gray-300 dark:border-gray-700">
        <p className="text-gray-500 mb-4">No tienes tiendas creadas aún.</p>
        <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
          Crear Nueva Tienda
        </button>
      </div>
    </div>
  );
}
