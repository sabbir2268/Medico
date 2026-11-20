import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { PATHS } from "@/utils/paths";

function Login() {
  const [formData, setFormData] = useState({ email: "", password: "" });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault(); // stop the browser's default page reload
    console.log("Login data:", formData); // real API call comes in a later phase
  };

  return (
    <div className="rounded-card border border-line bg-surface p-6 shadow-card">
      <h1 className="mb-6 text-2xl font-bold">Login</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          name="email"
          placeholder="Email"
          autoComplete="email"
          value={formData.email}
          onChange={handleChange}
          required
          className="w-full rounded-control border border-input bg-surface px-3 py-2 text-foreground placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-ring/30 focus:outline-none"
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          autoComplete="current-password"
          value={formData.password}
          onChange={handleChange}
          required
          className="w-full rounded-control border border-input bg-surface px-3 py-2 text-foreground placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-ring/30 focus:outline-none"
        />
        <Button type="submit" className="w-full">
          Login
        </Button>
      </form>
      <p className="mt-4 text-sm text-muted">
        No account?{" "}
        <Link to={PATHS.REGISTER} className="text-primary hover:underline">
          Register
        </Link>
      </p>
    </div>
  );
}

export default Login;
