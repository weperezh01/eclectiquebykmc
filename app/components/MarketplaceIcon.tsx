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
    return <SiWalmart size={size} className={className} />;
  }
  
  if (marketplaceLower.includes('mercari')) {
    return <FaBagShopping size={size} className={className} />;
  }
  
  if (marketplaceLower.includes('poshmark')) {
    return <FaStore size={size} className={className} />;
  }
  
  if (marketplaceLower.includes('ltk')) {
    return <FaLink size={size} className={className} />;
  }
  
  if (marketplaceLower.includes('facebook')) {
    return <FaFacebook size={size} className={className} />;
  }

  // Default fallback icon
  return <FaStore size={size} className={className} />;
}