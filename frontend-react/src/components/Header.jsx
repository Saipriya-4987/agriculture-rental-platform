// M3 step 2: Header component.
// Based on the <header class="site-header"> markup in frontend/index.html.
// Plain <a href="..."> links are used on purpose - React Router isn't
// part of this step yet, so these are regular links, not <Link>s.
function Header() {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <a href="index.html" className="logo">🌾 AgriRent</a>

        <nav className="main-nav">
          <a href="index.html" className="active">Home</a>
          <a href="equipment-list.html">Browse Equipment</a>
          <a href="login.html">Login</a>
          <a href="register.html" className="btn-nav">Register</a>
        </nav>
      </div>
    </header>
  )
}

export default Header