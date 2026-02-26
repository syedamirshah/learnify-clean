import React from "react";
import AuthPanel from "./AuthPanel";
import MobileDrawer from "./MobileDrawer";
import PublicHeader from "./PublicHeader";
import PublicNav from "./PublicNav";

export default function AppLayout({
  children,
  logoSrc,
  logoAlt,
  logoHref = "/",
  brandTitle,
  brandMotto,
  isAuthenticated = false,
  userFullName = "",
  username = "",
  password = "",
  remember = false,
  navItems = [],
  isMobileDrawerOpen = false,
  onOpenMobileDrawer,
  onCloseMobileDrawer,
  onUsernameChange,
  onPasswordChange,
  onRememberChange,
  onSignInClick,
  onLogoutClick,
  onProfileClick,
  mobileAuthContent = null,
  className = "",
}) {
  const drawerId = "primary-mobile-drawer";

  const desktopAuth = (
    <AuthPanel
      isAuthenticated={isAuthenticated}
      userFullName={userFullName}
      username={username}
      password={password}
      remember={remember}
      onUsernameChange={onUsernameChange}
      onPasswordChange={onPasswordChange}
      onRememberChange={onRememberChange}
      onSignInClick={onSignInClick}
      onLogoutClick={onLogoutClick}
      onProfileClick={onProfileClick}
    />
  );

  return (
    <div className={`min-h-screen bg-white text-gray-800 ${className}`}>
      <PublicHeader
        logoSrc={logoSrc}
        logoAlt={logoAlt}
        logoHref={logoHref}
        brandTitle={brandTitle}
        brandMotto={brandMotto}
        onMenuClick={onOpenMobileDrawer}
        isMenuOpen={isMobileDrawerOpen}
        menuControlsId={drawerId}
        desktopAuthContent={desktopAuth}
        mobileActionContent={mobileAuthContent}
      />

      <PublicNav items={navItems} />

      <MobileDrawer
        id={drawerId}
        isOpen={isMobileDrawerOpen}
        onClose={onCloseMobileDrawer}
        items={navItems}
        headerTitle={brandTitle || "Menu"}
      />

      <main className="min-w-0 overflow-x-hidden">{children}</main>
    </div>
  );
}
