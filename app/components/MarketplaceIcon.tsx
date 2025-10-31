import { FaAmazon, FaBagShopping, FaStore, FaLink, FaFacebook } from "react-icons/fa6";
import { SiEbay, SiWalmart } from "react-icons/si";

type Props = {
  marketplace: string;
  size?: number;
  className?: string;
};

export default function MarketplaceIcon({ 
  marketplace, 
  size = 18, 
  className = "" 
}: Props) {
  const marketplaceLower = marketplace.toLowerCase();

  // For Amazon, use official FaAmazon icon from React Icons
  if (marketplaceLower.includes('amazon')) {
    return <FaAmazon size={size} className={className} />;
  }

  // Icon mapping for other marketplaces
  if (marketplaceLower.includes('ebay')) {
    return <SiEbay size={size} className={className} />;
  }
  
  if (marketplaceLower.includes('walmart')) {
    return (
      <img 
        src="/images/logos/Walmart-Logo-Icon.png" 
        alt="Walmart" 
        width={size} 
        height={size} 
        className={`${className} object-cover rounded-full`}
        style={{ 
          transform: 'scale(1.3)'
        }}
      />
    );
  }
  
  if (marketplaceLower.includes('mercari')) {
    return <FaBagShopping size={size} className={className} />;
  }
  
  if (marketplaceLower.includes('poshmark')) {
    return <FaStore size={size} className={className} />;
  }
  
  if (marketplaceLower.includes('ltk')) {
    return (
      <img 
        src="/images/logos/LTK-logo.png" 
        alt="LTK" 
        width={size} 
        height={size} 
        className={`${className} object-cover rounded-full`}
        style={{ 
          filter: 'invert(1)',
          transform: 'scale(1.3)'
        }}
      />
    );
  }
  
  if (marketplaceLower.includes('shein')) {
    return (
      <img 
        src="/images/logos/shein-logo-rounded-shein-logo-free-png.webp" 
        alt="Shein" 
        width={size} 
        height={size} 
        className={`${className} object-cover rounded-full`}
        style={{ 
          transform: 'scale(1.3)'
        }}
      />
    );
  }
  
  if (marketplaceLower.includes('facebook')) {
    return <FaFacebook size={size} className={className} />;
  }

  // Default fallback icon
  return <FaStore size={size} className={className} />;
}