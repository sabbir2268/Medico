import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { PATHS } from "@/utils/paths";

function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Register data:", formData); // real API call comes in a later phase
  };

  return (
    <div className="rounded-card border border-line bg-surface p-6 shadow-card">
      <h1 className="mb-6 text-2xl font-bold">Create an account</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="name"
          placeholder="Name"
          autoComplete="name"
          value={formData.name}
          onChange={handleChange}
          required
          className="w-full rounded-control border border-input bg-surface px-3 py-2 text-foreground placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-ring/30 focus:outline-none"
        />
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
          placeholder="Password (min 8 characters)"
          autoComplete="new-password"
          value={formData.password}
          onChange={handleChange}
          required
          minLength={8}
          className="w-full rounded-control border border-input bg-surface px-3 py-2 text-foreground placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-ring/30 focus:outline-none"
        />
        <Button type="submit" className="w-full">
          Register
        </Button>
      </form>
      <p className="mt-4 text-sm text-muted">
        Already have an account?{" "}
        <Link to={PATHS.LOGIN} className="text-primary hover:underline">
          Login
        </Link>
      </p>
    </div>
  );
}

export default Register;
