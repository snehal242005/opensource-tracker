export function redirectForRole(role, navigate) {
  if (role === "student") navigate("/dashboard");
  else navigate("/staff");
}
