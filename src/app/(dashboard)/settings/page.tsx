export default function SettingsPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Configuración</h1>
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
        <h2 className="text-xl font-semibold mb-4">Perfil de Usuario</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
            <input type="text" className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700" placeholder="Tu nombre" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <input type="email" className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700" disabled value="usuario@email.com" />
          </div>
        </div>
      </div>
    </div>
  );
}
