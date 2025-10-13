// File: src/components/LogoNav.jsx
import { Link } from 'react-router-dom';
import logo from '../assets/logo.png';

export default function LogoNav() {
  return (
    <nav className="bg-white shadow-md py-2 px-4">
      <Link to="/">
        <img
          src={logo}
          alt="Learnify Home"
          className="h-12 w-auto hover:opacity-80 transition duration-200"
        />
      </Link>
    </nav>
  );
}