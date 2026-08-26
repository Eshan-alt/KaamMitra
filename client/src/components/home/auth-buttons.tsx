export function AuthButtons() {
  const handleLogin = () => {
    console.log("Login clicked - navigating to /login");
    window.location.href = "/login";
  };

  const handleRegister = () => {
    console.log("Register clicked - navigating to /register");
    window.location.href = "/register";
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 my-12 px-4">
      <button 
        onClick={handleLogin}
        className="w-full sm:w-auto btn-gradient min-w-[140px] cursor-pointer"
        type="button"
      >
        Login
      </button>
      <button 
        onClick={handleRegister}
        className="w-full sm:w-auto bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-3 px-8 rounded-full transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-lg shadow-md min-w-[140px] cursor-pointer"
        type="button"
      >
        Register
      </button>
    </div>
  );
}