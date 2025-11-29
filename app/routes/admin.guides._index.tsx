import type { MetaFunction } from "@remix-run/node";
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "@remix-run/react";
import { getGuideThumbnail } from "../utils/thumbnail";

type GuideItem = {
  title: string;
  image: string;
  href: string;
  is_featured?: boolean;
};

type GuideVideo = {
  id?: number;
  platform: string;
  video_url: string;
  youtube_url?: string; // Keep for backward compatibility
  title?: string;
  is_primary?: boolean;
};

type Guide = {
  slug: string;
  title: string;
  intro: string;
  youtubeUrl?: string;
  coverImage?: string;
  isPublic?: boolean;
  isFeatured?: boolean;
  sortOrder?: number;
  guideType?: string;
  videos?: GuideVideo[];
  items: GuideItem[];
};

export const meta: MetaFunction = () => ([
  { title: "Admin · Guides | Éclectique by KMC" },
]);

export default function AdminGuidesPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [verifying, setVerifying] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [guides, setGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create/Edit modal state
  const [openModal, setOpenModal] = useState(false);
  const [editingGuide, setEditingGuide] = useState<Guide | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Guide>({
    slug: "",
    title: "",
    intro: "",
    youtubeUrl: "",
    coverImage: "",
    isPublic: true,
    isFeatured: false,
    sortOrder: 0,
    guideType: "Look",
    videos: [],
    items: []
  });

  // Item form state
  const [itemForm, setItemForm] = useState<GuideItem>({
    title: "",
    image: "",
    href: "",
    is_featured: false
  });
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [exitingItemIndex, setExitingItemIndex] = useState<number | null>(null);

  // Video form state
  const [videoForm, setVideoForm] = useState<{
    platform: string;
    video_url: string;
    title: string;
  }>({
    platform: "youtube",
    video_url: "",
    title: ""
  });

  // Drag and drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  const [draggedGuideIndex, setDraggedGuideIndex] = useState<number | null>(null);

  useEffect(() => {
    setVerifying(true);
    
    // Temporary bypass for admin access - remove when proper auth is set up
    const tempAdminAccess = async () => {
      // Mark that user has admin access for this session
      sessionStorage.setItem('eclectique_admin_access', 'true');
      localStorage.setItem('eclectique_admin_bypass', 'true');
      setIsAdmin(true);
      setVerifying(false);
      // Load guides but don't wait for it to complete verification
      loadGuides().catch(() => {
        // If loading guides fails, still show the admin interface
        setError('Could not load guides. Please try refreshing the page.');
      });
    };

    // Try authentication first, but fall back to temp access
    fetch('/api/auth/me', { credentials: 'include' })
      .then(async (r) => {
        if (r.ok) {
          const me = await r.json();
          if (me?.rol !== 'admin') {
            // For now, allow access anyway - remove this when proper auth is implemented
            tempAdminAccess();
            return;
          }
          setIsAdmin(true);
          setVerifying(false);
          loadGuides().catch(() => {
            setError('Could not load guides. Please try refreshing the page.');
          });
        } else {
          // Temporary: allow admin access without login
          tempAdminAccess();
        }
      })
      .catch(() => {
        // Temporary: allow admin access if auth fails
        tempAdminAccess();
      });
  }, []);

  // Reload guides when filter type changes
  useEffect(() => {
    if (isAdmin) {
      loadGuides();
    }
  }, [searchParams.get('type'), isAdmin]);

  const loadGuides = async () => {
    setLoading(true);
    setError(null);
    try {
      const filterType = searchParams.get('type');
      const url = filterType ? `/api/guides?type=${filterType}&admin=true` : '/api/guides?admin=true';
      
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      
      setGuides(data);
    } catch (e: any) {
      setError(e?.message || 'Error loading guides');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    const filterType = searchParams.get('type');
    setEditingGuide(null);
    setForm({
      slug: "",
      title: "",
      intro: "",
      youtubeUrl: "",
      coverImage: "",
      isPublic: true,
      sortOrder: 0,
      guideType: filterType === 'Deal' ? 'Deal' : 'Look',
      videos: [],
      items: []
    });
    setOpenModal(true);
  };

  const openEditModal = (guide: Guide) => {
    setEditingGuide(guide);
    // Ensure videos array is properly initialized and include isPublic and sortOrder
    const formData = {
      ...guide,
      videos: guide.videos || [],
      isPublic: guide.isPublic !== undefined ? guide.isPublic : true,
      sortOrder: guide.sortOrder !== undefined ? guide.sortOrder : 0,
      guideType: guide.guideType || "Look"
    };
    setForm(formData);
    setOpenModal(true);
  };

  const addItem = () => {
    if (!itemForm.title.trim()) return;
    if (editingItemIndex !== null) {
      updateItem();
    } else {
      setForm({
        ...form,
        items: [...form.items, { ...itemForm }]
      });
      setItemForm({ title: "", image: "", href: "", is_featured: false });
    }
  };

  const removeItem = (index: number) => {
    const newItems = form.items.filter((_, i) => i !== index);
    
    setForm({
      ...form,
      items: newItems
    });
    
    // Si estábamos editando este item, cancelar la edición con animación
    if (editingItemIndex === index) {
      setExitingItemIndex(index);
      setTimeout(() => {
        setEditingItemIndex(null);
        setExitingItemIndex(null);
        setItemForm({ title: "", image: "", href: "", is_featured: false });
      }, 300); // Duration matches slideUp animation
    }
  };

  const editItem = (index: number) => {
    const item = form.items[index];
    setItemForm({
      title: item.title,
      image: item.image,
      href: item.href,
      is_featured: item.is_featured || false
    });
    setEditingItemIndex(index);
  };

  const updateItem = () => {
    if (!itemForm.title.trim() || editingItemIndex === null) return;
    const updatedItems = [...form.items];
    updatedItems[editingItemIndex] = { ...itemForm };
    setForm({
      ...form,
      items: updatedItems
    });
    
    // Trigger exit animation
    const currentIndex = editingItemIndex;
    setExitingItemIndex(currentIndex);
    setTimeout(() => {
      setEditingItemIndex(null);
      setExitingItemIndex(null);
      setItemForm({ title: "", image: "", href: "", is_featured: false });
    }, 300); // Duration matches slideUp animation
  };

  const cancelEditItem = () => {
    const currentIndex = editingItemIndex;
    if (currentIndex !== null) {
      setExitingItemIndex(currentIndex);
      // Start exit animation, then clear state after animation completes
      setTimeout(() => {
        setEditingItemIndex(null);
        setExitingItemIndex(null);
        setItemForm({ title: "", image: "", href: "", is_featured: false });
      }, 300); // Duration matches slideUp animation
    }
  };

  const addVideo = () => {
    if (!videoForm.video_url.trim()) return;
    const newVideos = [...(form.videos || [])];
    newVideos.push({
      platform: videoForm.platform,
      video_url: videoForm.video_url,
      title: videoForm.title || undefined,
      is_primary: newVideos.length === 0 // First video is primary by default
    });
    setForm({
      ...form,
      videos: newVideos
    });
    setVideoForm({ platform: "youtube", video_url: "", title: "" });
  };

  const removeVideo = (index: number) => {
    const newVideos = [...(form.videos || [])];
    const removedVideo = newVideos[index];
    
    newVideos.splice(index, 1);
    
    // If we removed the primary video, make the first remaining video primary
    if (removedVideo?.is_primary && newVideos.length > 0) {
      newVideos[0].is_primary = true;
    }
    
    // IMPORTANT: If all videos are removed, clear the legacy youtubeUrl field
    // to prevent automatic re-migration of the deleted video
    const updatedForm = {
      ...form,
      videos: newVideos
    };
    
    if (newVideos.length === 0) {
      updatedForm.youtubeUrl = "";
    }
    
    setForm(updatedForm);
  };

  const setPrimaryVideo = (index: number) => {
    const newVideos = [...(form.videos || [])];
    newVideos.forEach((video, i) => {
      video.is_primary = i === index;
    });
    setForm({
      ...form,
      videos: newVideos
    });
  };

  // Drag and drop functions
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    // Use a non-empty plain-text payload for broader browser support (Safari/Edge)
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    const newVideos = [...(form.videos || [])];
    const draggedVideo = newVideos[draggedIndex];
    
    // Remove the dragged video from its original position
    newVideos.splice(draggedIndex, 1);
    
    // Insert it at the new position
    newVideos.splice(dropIndex, 0, draggedVideo);
    
    setForm({
      ...form,
      videos: newVideos
    });
    
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // Drag and drop functions for items
  const handleItemDragStart = (e: React.DragEvent, index: number) => {
    setDraggedItemIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    // Use a non-empty plain-text payload for broader browser support (Safari/Edge)
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleItemDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleItemDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleItemDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedItemIndex === null || draggedItemIndex === dropIndex) {
      setDraggedItemIndex(null);
      return;
    }

    const newItems = [...form.items];
    const draggedItem = newItems[draggedItemIndex];
    
    // Remove the dragged item from its original position
    newItems.splice(draggedItemIndex, 1);
    
    // Insert it at the new position
    newItems.splice(dropIndex, 0, draggedItem);
    
    setForm({
      ...form,
      items: newItems
    });
    
    setDraggedItemIndex(null);
  };

  const handleItemDragEnd = () => {
    setDraggedItemIndex(null);
  };

  // Drag and drop functions for guides
  const handleGuideDragStart = (e: React.DragEvent, index: number) => {
    setDraggedGuideIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleGuideDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleGuideDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleGuideDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedGuideIndex === null || draggedGuideIndex === dropIndex) {
      setDraggedGuideIndex(null);
      return;
    }

    console.log('=== DRAG AND DROP DEBUG ===');
    console.log('Dragged index:', draggedGuideIndex);
    console.log('Drop index:', dropIndex);
    console.log('Current guides:', guides.map(g => ({ slug: g.slug, title: g.title, sortOrder: g.sortOrder })));

    const newGuides = [...guides];
    const draggedGuide = newGuides[draggedGuideIndex];
    
    console.log('Dragged guide:', draggedGuide.slug, draggedGuide.title);
    
    // Remove the dragged guide from its original position
    newGuides.splice(draggedGuideIndex, 1);
    
    // Insert it at the new position
    newGuides.splice(dropIndex, 0, draggedGuide);
    
    console.log('New order:', newGuides.map(g => ({ slug: g.slug, title: g.title })));
    
    // Update the guides state immediately for visual feedback
    setGuides(newGuides);
    
    // Update sort_order values based on new positions - but only for filtered guides
    const updatePromises = newGuides.map(async (guide, index) => {
      try {
        const updatedGuide = { ...guide, sortOrder: index };
        console.log(`Updating ${guide.slug} with sortOrder: ${index}`);
        
        const res = await fetch(`/api/guides/${guide.slug}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(updatedGuide),
        });
        
        if (!res.ok) {
          console.error(`Failed to update guide ${guide.slug}`, await res.text());
        } else {
          console.log(`Successfully updated ${guide.slug}`);
        }
      } catch (error) {
        console.error(`Error updating guide ${guide.slug}:`, error);
      }
    });

    // Wait for all updates to complete
    await Promise.all(updatePromises);
    
    setDraggedGuideIndex(null);
    
    console.log('Reloading guides...');
    // Reload guides to ensure consistency
    loadGuides();
  };

  const handleGuideDragEnd = () => {
    setDraggedGuideIndex(null);
  };

  // Fallback controls for reorder (Up/Down buttons)
  const moveGuide = async (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= guides.length || fromIndex === toIndex) return;
    const newGuides = [...guides];
    const [moved] = newGuides.splice(fromIndex, 1);
    newGuides.splice(toIndex, 0, moved);
    setGuides(newGuides);

    // Persist new order
    const updatePromises = newGuides.map(async (guide, index) => {
      try {
        const updatedGuide = { ...guide, sortOrder: index };
        const res = await fetch(`/api/guides/${guide.slug}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(updatedGuide),
        });
        if (!res.ok) {
          console.error(`Failed to update guide ${guide.slug}`, await res.text());
        }
      } catch (error) {
        console.error(`Error updating guide ${guide.slug}:`, error);
      }
    });
    await Promise.all(updatePromises);
    loadGuides();
  };

  const saveGuide = async () => {
    // Clear any previous errors
    setError(null);
    
    // Validate required fields
    if (!form.title.trim()) {
      setError('Title is required');
      return;
    }
    if (!form.slug.trim()) {
      setError('Slug is required');
      return;
    }
    if (!form.intro.trim()) {
      setError('Introduction is required');
      return;
    }
    
    setSaving(true);
    try {
      const method = editingGuide ? 'PUT' : 'POST';
      const url = editingGuide ? `/api/guides/${editingGuide.slug}` : '/api/guides';
      
      console.log('=== SAVING GUIDE ===');
      console.log('Method:', method);
      console.log('URL:', url);
      console.log('Form data being sent:', form);
      console.log('Items in form:', form.items);
      console.log('Items count:', form.items.length);
      console.log('Items details:', form.items.map((item, i) => `${i}: ${item.title}`));
      console.log('Videos in form:', form.videos);
      console.log('Videos length:', form.videos?.length || 0);
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      });
      
      console.log('Response status:', res.status);
      
      if (!res.ok) {
        let errorMessage = 'Failed to save guide';
        try {
          const errorData = await res.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = `Server error: ${res.status} ${res.statusText}`;
        }
        throw new Error(errorMessage);
      }
      
      const result = await res.json();
      console.log('Save result:', result);
      
      setOpenModal(false);
      await loadGuides();
    } catch (e: any) {
      console.error('Error saving guide:', e);
      setError(e?.message || 'Error saving guide');
    } finally {
      setSaving(false);
    }
  };

  const deleteGuide = async (slug: string) => {
    if (!confirm('Are you sure you want to delete this guide?')) return;
    
    try {
      const res = await fetch(`/api/guides/${slug}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete guide');
      }
      
      await loadGuides();
    } catch (e: any) {
      alert(e?.message || 'Error deleting guide');
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  if (verifying) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-2xl font-bold">Admin · Guides</h1>
        <p className="mt-2 text-sm text-gray-600">Verifying admin permissions...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Admin · Guides
            {(() => {
              const filterType = searchParams.get('type');
              if (filterType) {
                return (
                  <span className="ml-2 text-lg font-medium text-blue-600">
                    ({filterType === 'Deal' ? 'Deals Only' : 'Looks Only'})
                  </span>
                );
              }
              return null;
            })()}
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage {(() => {
              const filterType = searchParams.get('type');
              if (filterType === 'Deal') return 'deal guides and promotions';
              if (filterType === 'Look') return 'style guides and curated looks';
              return 'style guides and curated looks';
            })()}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/admin/products" className="rounded-md border border-gray-300 px-3 py-2 text-sm hover:bg-black/5">
            View Products
          </Link>
          <button 
            onClick={openCreateModal} 
            className="rounded-md bg-black px-3 py-2 text-sm text-white"
          >
            {(() => {
              const filterType = searchParams.get('type');
              return filterType === 'Deal' ? 'New Deal' : 'New Guide';
            })()}
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <p className="mt-6 text-sm text-gray-600">Loading guides...</p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {guides.map((guide, index) => {
            const thumbnail = getGuideThumbnail(guide);
            
            return (
            <div 
              key={guide.slug} 
              draggable
              onDragStart={(e) => handleGuideDragStart(e, index)}
              onDragOver={handleGuideDragOver}
              onDragEnter={handleGuideDragEnter}
              onDrop={(e) => handleGuideDrop(e, index)}
              onDragEnd={handleGuideDragEnd}
              className={`rounded-lg border border-gray-200 bg-white p-4 relative cursor-move ${
                draggedGuideIndex === index 
                  ? 'opacity-50' 
                  : 'hover:bg-gray-50'
              }`}
            >
              {/* Guide Order Number - Distinctive style */}
              <div className="absolute -top-2 -left-2 w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white text-xs font-bold flex items-center justify-center shadow-lg border-2 border-white z-10 pointer-events-none">
                {index + 1}
              </div>
              
              {/* Drag Handle (visual indicator only) */}
              <div className="absolute top-2 right-2 text-gray-400 opacity-60 hover:opacity-100 transition-opacity pointer-events-none">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M7 2a2 2 0 1 1 .001 4.001A2 2 0 0 1 7 2zM7 8a2 2 0 1 1 .001 4.001A2 2 0 0 1 7 8zM7 14a2 2 0 1 1 .001 4.001A2 2 0 0 1 7 14zM13 2a2 2 0 1 1 .001 4.001A2 2 0 0 1 13 2zM13 8a2 2 0 1 1 .001 4.001A2 2 0 0 1 13 8zM13 14a2 2 0 1 1 .001 4.001A2 2 0 0 1 13 14z"></path>
                </svg>
              </div>
              
              <div className="flex gap-3 pt-2">
                {/* Thumbnail */}
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  <img
                    src={thumbnail}
                    alt={guide.title}
                    className="w-full h-full object-cover"
                    draggable={false}
                    onError={(e) => {
                      e.currentTarget.src = '/images/guide-placeholder.svg';
                    }}
                  />
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm truncate">{guide.title}</h3>
                    <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded-full flex-shrink-0">
                      #{guide.sortOrder || 0}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 font-medium ${
                      guide.guideType === 'Deal' 
                        ? 'bg-orange-100 text-orange-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {guide.guideType || 'Look'}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-600 overflow-hidden" style={{ 
                    display: '-webkit-box', 
                    WebkitLineClamp: 2, 
                    WebkitBoxOrient: 'vertical' 
                  }}>{guide.intro}</p>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                <span>{guide.items.length} items</span>
                {guide.videos && guide.videos.length > 0 && (
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                    {guide.videos.length} video{guide.videos.length > 1 ? 's' : ''}
                  </span>
                )}
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                  guide.isPublic 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {guide.isPublic ? (
                    <>
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                      </svg>
                      Public
                    </>
                  ) : (
                    <>
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd"/>
                        <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z"/>
                      </svg>
                      Private
                    </>
                  )}
                </span>
              </div>
              <div className="mt-3 flex gap-2">
                {/* Fallback reorder controls */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    moveGuide(index, index - 1);
                  }}
                  className="rounded border border-gray-300 px-2 py-1 text-xs hover:bg-black/5"
                  title="Move up"
                >
                  ▲
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    moveGuide(index, index + 1);
                  }}
                  className="rounded border border-gray-300 px-2 py-1 text-xs hover:bg-black/5"
                  title="Move down"
                >
                  ▼
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openEditModal(guide);
                  }}
                  className="rounded bg-black px-3 py-1 text-sm text-white"
                >
                  Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteGuide(guide.slug);
                  }}
                  className="rounded bg-red-600 px-3 py-1 text-sm text-white"
                >
                  Delete
                </button>
                <Link
                  to={`/guides/${guide.slug}`}
                  onClick={(e) => e.stopPropagation()}
                  className="rounded border border-gray-300 px-3 py-1 text-sm hover:bg-black/5"
                >
                  View
                </Link>
              </div>
            </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      {openModal && (
        <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {editingGuide ? 
                  `Edit ${editingGuide.guideType || 'Guide'}` : 
                  (() => {
                    const filterType = searchParams.get('type');
                    return filterType === 'Deal' ? 'Create New Deal' : 'Create New Guide';
                  })()
                }
              </h3>
              <button 
                onClick={() => setOpenModal(false)} 
                className="rounded border border-gray-300 px-2 py-1 text-sm"
              >
                Close
              </button>
            </div>

            {error && (
              <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="mt-4 space-y-4">
              {/* Guide Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Title</label>
                  <input 
                    className="w-full rounded-md border border-gray-300 px-3 py-2" 
                    value={form.title} 
                    onChange={(e) => {
                      const title = e.target.value;
                      setForm({ 
                        ...form, 
                        title,
                        slug: editingGuide ? form.slug : generateSlug(title)
                      });
                    }} 
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Slug</label>
                  <input 
                    className="w-full rounded-md border border-gray-300 px-3 py-2" 
                    value={form.slug} 
                    onChange={(e) => setForm({ ...form, slug: e.target.value })} 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Sort Order</label>
                  <input 
                    type="number"
                    min="0"
                    className="w-full rounded-md border border-gray-300 px-3 py-2" 
                    value={form.sortOrder || 0} 
                    onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })} 
                  />
                  <p className="text-xs text-gray-500 mt-1">Lower numbers appear first in the guides list</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Type</label>
                  <select 
                    className="w-full rounded-md border border-gray-300 px-3 py-2" 
                    value={form.guideType || "Look"} 
                    onChange={(e) => setForm({ ...form, guideType: e.target.value })}
                  >
                    <option value="Look">Look</option>
                    <option value="Deal">Deal</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Choose between Look (style guide) or Deal (promotional content)</p>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">Intro</label>
                <textarea 
                  className="w-full rounded-md border border-gray-300 px-3 py-2" 
                  rows={3}
                  value={form.intro} 
                  onChange={(e) => setForm({ ...form, intro: e.target.value })} 
                />
              </div>

              {/* Public/Private Visibility Toggle */}
              <div>
                <label className="block text-sm text-gray-700 mb-3">Visibility</label>
                <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-md">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="visibility-public"
                      name="visibility"
                      value="public"
                      checked={form.isPublic === true}
                      onChange={() => setForm({ ...form, isPublic: true })}
                      className="h-4 w-4 text-accent border-gray-300 focus:ring-accent"
                    />
                    <label htmlFor="visibility-public" className="ml-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                      <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                      </svg>
                      Public
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="visibility-private"
                      name="visibility"
                      value="private"
                      checked={form.isPublic === false}
                      onChange={() => setForm({ ...form, isPublic: false })}
                      className="h-4 w-4 text-accent border-gray-300 focus:ring-accent"
                    />
                    <label htmlFor="visibility-private" className="ml-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                      <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd"/>
                        <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z"/>
                      </svg>
                      Private
                    </label>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Public guides are visible to all visitors. Private guides are only visible in admin interface.
                </p>
              </div>

              {/* Featured Guide Toggle */}
              <div>
                <label className="block text-sm text-gray-700 mb-3">Featured on Homepage</label>
                <div className="flex items-center gap-3 p-4 border border-gray-200 rounded-md">
                  <input
                    type="checkbox"
                    id="is-featured"
                    checked={form.isFeatured || false}
                    onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                    className="h-4 w-4 text-accent border-gray-300 rounded focus:ring-accent"
                  />
                  <label htmlFor="is-featured" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <svg className="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                    </svg>
                    Show this guide on homepage
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Featured guides will appear in the "{form.guideType === 'Deal' ? 'Deals' : 'Looks'}" section on the homepage.
                </p>
              </div>

              {/* Cover Image Section */}
              <div>
                <label className="block text-sm text-gray-700 mb-3">Cover Image (optional)</label>
                
                {/* Upload File Option */}
                <div className="border border-gray-200 rounded-md p-4 mb-4">
                  <h5 className="text-sm font-medium mb-2">Upload from Device</h5>
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        
                        console.log('File selected:', file.name, file.size, file.type);
                        setError(null);
                        
                        // Show loading state
                        setError('Uploading...');
                        
                        const formData = new FormData();
                        formData.append('image', file);
                        
                        try {
                          console.log('Making upload request...');
                          const response = await fetch('/admin/upload', {
                            method: 'POST',
                            body: formData
                          });
                          
                          console.log('Response status:', response.status);
                          
                          if (!response.ok) {
                            const errorText = await response.text();
                            console.log('Error response:', errorText);
                            throw new Error(`Server error: ${response.status}`);
                          }
                          
                          const result = await response.json();
                          console.log('Upload result:', result);
                          console.log('Setting cover image to:', result.url);
                          setForm({ ...form, coverImage: result.url });
                          setError('Upload successful!');
                        } catch (error: any) {
                          console.error('Upload error:', error);
                          setError(`Upload failed: ${error.message}`);
                        }
                      }}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-accent file:text-white hover:file:bg-accent/80"
                    />
                    <span className="text-xs text-gray-500">Max 10MB (JPEG, PNG, WebP)</span>
                  </div>
                </div>

                {/* URL Option */}
                <div className="border border-gray-200 rounded-md p-4">
                  <h5 className="text-sm font-medium mb-2">Or Enter URL</h5>
                  <input 
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" 
                    type="url"
                    value={form.coverImage || ''} 
                    onChange={(e) => setForm({ ...form, coverImage: e.target.value })} 
                    placeholder="/images/guides/cover.webp or https://example.com/image.jpg"
                  />
                </div>

                {/* Preview */}
                {form.coverImage && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-md">
                    <p className="text-xs text-gray-600 mb-2">Preview: {form.coverImage}</p>
                    <div className="flex items-center gap-3">
                      <img 
                        src={form.coverImage} 
                        alt="Cover preview" 
                        className="w-20 h-20 object-cover rounded-md border"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">{form.coverImage}</p>
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, coverImage: '' })}
                          className="text-xs text-red-600 hover:text-red-800 mt-1"
                        >
                          Remove cover image
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <p className="text-xs text-gray-500 mt-2">
                  If provided, this image will be used as the guide thumbnail instead of video thumbnails.
                </p>
              </div>

              {/* Social Media Videos Section */}
              <div>
                <h4 className="text-md font-medium mb-3">Social Media Videos</h4>
                
                {/* Add Video Form */}
                <div className="border border-gray-200 rounded-md p-4 mb-4">
                  <h5 className="text-sm font-medium mb-2">Add New Video</h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Platform *</label>
                      <select 
                        className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm" 
                        value={videoForm.platform} 
                        onChange={(e) => setVideoForm({ ...videoForm, platform: e.target.value })}
                      >
                        <option value="youtube">YouTube</option>
                        <option value="instagram">Instagram</option>
                        <option value="facebook">Facebook</option>
                        <option value="tiktok">TikTok</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Video URL *</label>
                      <input 
                        className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm" 
                        type="url"
                        value={videoForm.video_url} 
                        onChange={(e) => setVideoForm({ ...videoForm, video_url: e.target.value })} 
                        placeholder={
                          videoForm.platform === 'youtube' ? "https://www.youtube.com/watch?v=..." :
                          videoForm.platform === 'instagram' ? "https://www.instagram.com/p/..." :
                          videoForm.platform === 'facebook' ? "https://www.facebook.com/watch?v=..." :
                          "https://www.tiktok.com/@user/video/..."
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Video Title (optional)</label>
                      <input 
                        className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm" 
                        value={videoForm.title} 
                        onChange={(e) => setVideoForm({ ...videoForm, title: e.target.value })} 
                        placeholder="e.g., Spring Style Guide"
                      />
                    </div>
                  </div>
                  <button 
                    onClick={addVideo}
                    disabled={!videoForm.video_url.trim()}
                    className="mt-2 rounded bg-blue-600 px-3 py-1 text-sm text-white disabled:opacity-50"
                  >
                    Add Video
                  </button>
                </div>

                {/* Current Videos */}
                <div className="space-y-2">
                  {form.videos && form.videos.length > 0 ? (
                    form.videos.map((video, index) => {
                      const platformColors: Record<string, string> = {
                        youtube: 'bg-red-100 text-red-800',
                        instagram: 'bg-purple-100 text-purple-800',
                        facebook: 'bg-blue-100 text-blue-800',
                        tiktok: 'bg-black text-white'
                      };
                      const platformEmojis: Record<string, string> = {
                        youtube: '🎥',
                        instagram: '📸',
                        facebook: '📘',
                        tiktok: '🎵'
                      };
                      
                      return (
                        <div 
                          key={index} 
                          draggable
                          onDragStart={(e) => handleDragStart(e, index)}
                          onDragOver={handleDragOver}
                          onDragEnter={handleDragEnter}
                          onDrop={(e) => handleDrop(e, index)}
                          onDragEnd={handleDragEnd}
                          className={`flex items-center gap-3 border border-gray-200 rounded-md p-3 cursor-move transition-all duration-200 ${
                            draggedIndex === index 
                              ? 'opacity-50 bg-gray-50' 
                              : 'hover:bg-gray-50 hover:border-gray-300'
                          }`}
                        >
                          {/* Order Number and Drag Handle */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <div className="w-6 h-6 rounded-full bg-accent text-white text-xs font-bold flex items-center justify-center">
                              {index + 1}
                            </div>
                            <div className="text-gray-400 cursor-move">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M7 2a2 2 0 1 1 .001 4.001A2 2 0 0 1 7 2zM7 8a2 2 0 1 1 .001 4.001A2 2 0 0 1 7 8zM7 14a2 2 0 1 1 .001 4.001A2 2 0 0 1 7 14zM13 2a2 2 0 1 1 .001 4.001A2 2 0 0 1 13 2zM13 8a2 2 0 1 1 .001 4.001A2 2 0 0 1 13 8zM13 14a2 2 0 1 1 .001 4.001A2 2 0 0 1 13 14z"></path>
                              </svg>
                            </div>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm flex items-center gap-2 flex-wrap">
                              <span className={`text-xs px-2 py-1 rounded flex-shrink-0 ${platformColors[video.platform] || 'bg-gray-100 text-gray-800'}`}>
                                {platformEmojis[video.platform]} {video.platform.charAt(0).toUpperCase() + video.platform.slice(1)}
                              </span>
                              <span className="truncate">{video.title || `Video ${index + 1}`}</span>
                              {video.is_primary && (
                                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded flex-shrink-0">
                                  Primary (Thumbnail)
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 truncate mt-1">{video.video_url || video.youtube_url}</div>
                          </div>
                          
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {!video.is_primary && (
                              <button
                                onClick={() => setPrimaryVideo(index)}
                                className="rounded bg-green-600 px-2 py-1 text-xs text-white hover:bg-green-700 transition-colors"
                              >
                                Make Primary
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                removeVideo(index);
                              }}
                              className="rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700 transition-colors"
                              type="button"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-gray-500 italic">No videos added yet</p>
                  )}
                </div>
                
                <div className="mt-3 p-3 bg-blue-50 rounded-md">
                  <p className="text-xs text-blue-700">
                    <strong>Tips:</strong><br/>
                    • The primary video will be used for the guide's thumbnail<br/>
                    • Drag and drop videos to reorder them using the drag handle (⋮⋮)<br/>
                    • Videos are numbered in order starting from 1<br/>
                    • Supports YouTube, Instagram, Facebook, and TikTok videos<br/>
                    • If no videos are added, the system will use images from sub-items as before
                  </p>
                </div>
              </div>

              {/* Items Section */}
              <div>
                <h4 className="text-md font-medium mb-3">Guide Items</h4>
                
                {/* Add Item Form */}
                <div className="border border-gray-200 rounded-md p-4 mb-4">
                  <h5 className="text-sm font-medium mb-3">Add New Item</h5>
                  
                  {/* Item Title */}
                  <div className="mb-3">
                    <label className="block text-xs text-gray-600 mb-1">Item Title</label>
                    <input 
                      className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm" 
                      value={itemForm.title} 
                      onChange={(e) => setItemForm({ ...itemForm, title: e.target.value })} 
                      placeholder="e.g., Long cardigan"
                    />
                  </div>

                  {/* Image Section */}
                  <div className="mb-3">
                    <label className="block text-xs text-gray-600 mb-2">Item Image</label>
                    
                    {/* Upload File Option */}
                    <div className="border border-gray-200 rounded-md p-3 mb-3">
                      <h6 className="text-xs font-medium mb-2">Upload from Device</h6>
                      <div className="flex items-center gap-3">
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            
                            console.log('Item file selected:', file.name, file.size, file.type);
                            setError(null);
                            
                            // Show loading state
                            setError('Uploading...');
                            
                            const formData = new FormData();
                            formData.append('image', file);
                            
                            try {
                              console.log('Making upload request...');
                              const response = await fetch('/admin/upload', {
                                method: 'POST',
                                body: formData
                              });
                              
                              console.log('Response status:', response.status);
                              
                              if (!response.ok) {
                                const errorText = await response.text();
                                console.log('Error response:', errorText);
                                throw new Error(`Server error: ${response.status}`);
                              }
                              
                              const result = await response.json();
                              console.log('Upload result:', result);
                              console.log('Setting item image to:', result.url);
                              setItemForm({ ...itemForm, image: result.url });
                              setError('Upload successful!');
                            } catch (error: any) {
                              console.error('Upload error:', error);
                              setError(`Upload failed: ${error.message}`);
                            }
                          }}
                          className="block w-full text-xs text-gray-500 file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-accent file:text-white hover:file:bg-accent/80"
                        />
                        <span className="text-xs text-gray-500">Max 10MB (JPEG, PNG, WebP)</span>
                      </div>
                    </div>

                    {/* URL Option */}
                    <div className="border border-gray-200 rounded-md p-3">
                      <h6 className="text-xs font-medium mb-2">Or Enter Image URL</h6>
                      <input 
                        className="w-full rounded-md border border-gray-300 px-2 py-1 text-xs" 
                        type="url"
                        value={itemForm.image} 
                        onChange={(e) => setItemForm({ ...itemForm, image: e.target.value })} 
                        placeholder="/images/guides/item.webp or https://example.com/image.jpg"
                      />
                    </div>

                    {/* Preview */}
                    {itemForm.image && (
                      <div className="mt-2 p-2 bg-gray-50 rounded-md">
                        <p className="text-xs text-gray-600 mb-1">Preview: {itemForm.image}</p>
                        <div className="flex items-center gap-2">
                          <img 
                            src={itemForm.image} 
                            alt="Item preview" 
                            className="w-12 h-12 object-cover rounded border"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                          <div className="flex-1">
                            <p className="text-xs text-gray-900 truncate">{itemForm.image}</p>
                            <button
                              type="button"
                              onClick={() => setItemForm({ ...itemForm, image: '' })}
                              className="text-xs text-red-600 hover:text-red-800"
                            >
                              Remove item image
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Purchase Link */}
                  <div className="mb-3">
                    <label className="block text-xs text-gray-600 mb-1">Purchase Link</label>
                    <input 
                      className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm" 
                      value={itemForm.href} 
                      onChange={(e) => setItemForm({ ...itemForm, href: e.target.value })} 
                      placeholder="https://..."
                    />
                  </div>

                  {/* Featured Checkbox */}
                  <div className="mb-3">
                    <label className="flex items-center gap-2 text-xs text-gray-600">
                      <input
                        type="checkbox"
                        checked={itemForm.is_featured || false}
                        onChange={(e) => setItemForm({ ...itemForm, is_featured: e.target.checked })}
                        className="h-4 w-4 text-accent border-gray-300 rounded focus:ring-accent"
                      />
                      <span>Featured item</span>
                    </label>
                    <p className="text-xs text-gray-500 mt-1 ml-6">Featured items will be highlighted with a star indicator</p>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={addItem}
                      disabled={!itemForm.title.trim()}
                      className="mt-2 rounded bg-green-600 px-3 py-1 text-sm text-white disabled:opacity-50"
                    >
                      {editingItemIndex !== null ? 'Update Item' : 'Add Item'}
                    </button>
                    {editingItemIndex !== null && (
                      <button 
                        onClick={cancelEditItem}
                        className="mt-2 rounded bg-gray-500 px-3 py-1 text-sm text-white hover:bg-gray-600"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>

                {/* Current Items */}
                <div className="space-y-2">
                  {form.items.length > 0 ? (
                    form.items.map((item, index) => (
                      <div key={index} className="space-y-0">
                        <div 
                          draggable
                          onDragStart={(e) => handleItemDragStart(e, index)}
                          onDragOver={handleItemDragOver}
                          onDragEnter={handleItemDragEnter}
                          onDrop={(e) => handleItemDrop(e, index)}
                          onDragEnd={handleItemDragEnd}
                          className={`flex items-center gap-3 border rounded-md p-3 cursor-move transition-all duration-300 ${
                            draggedItemIndex === index 
                              ? 'opacity-50 bg-gray-50 border-gray-200' 
                              : editingItemIndex === index
                                ? 'bg-blue-50 border-blue-300 shadow-md transform scale-[1.02]'
                                : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm'
                          }`}
                        >
                          {/* Order Number and Drag Handle */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <div className="w-6 h-6 rounded-full bg-accent text-white text-xs font-bold flex items-center justify-center">
                              {index + 1}
                            </div>
                            <div className="text-gray-400 cursor-move">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M7 2a2 2 0 1 1 .001 4.001A2 2 0 0 1 7 2zM7 8a2 2 0 1 1 .001 4.001A2 2 0 0 1 7 8zM7 14a2 2 0 1 1 .001 4.001A2 2 0 0 1 7 14zM13 2a2 2 0 1 1 .001 4.001A2 2 0 0 1 13 2zM13 8a2 2 0 1 1 .001 4.001A2 2 0 0 1 13 8zM13 14a2 2 0 1 1 .001 4.001A2 2 0 0 1 13 14z"></path>
                              </svg>
                            </div>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate flex items-center gap-2">
                              {item.title}
                              {item.is_featured && (
                                <span className="text-yellow-500 text-sm" title="Featured item">
                                  ⭐
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 truncate mt-1">{item.href}</div>
                          </div>
                          
                          <div className="flex-shrink-0 flex gap-2">
                            <button
                              onClick={() => editItem(index)}
                              className="rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700 active:scale-95 transition-all duration-200"
                            >
                              Edit
                            </button>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                removeItem(index);
                              }}
                              className="rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700 active:scale-95 transition-all duration-200"
                            >
                              Remove
                            </button>
                          </div>
                        </div>

                        {/* Inline Edit Form */}
                        {(editingItemIndex === index || exitingItemIndex === index) && (
                          <div 
                            className={`bg-blue-25 border border-blue-200 rounded-md p-4 mt-2 transition-all duration-300 overflow-hidden ${
                              exitingItemIndex === index 
                                ? 'animate-slideUp' 
                                : 'animate-slideDown ease-out'
                            }`}
                            style={{
                              animationFillMode: 'both'
                            }}
                          >
                            <h6 className="text-sm font-medium mb-3 text-blue-800 animate-fadeIn">Edit Item</h6>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn" style={{ animationDelay: '0.1s' }}>
                              {/* Title */}
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">Item Title</label>
                                <input 
                                  className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm" 
                                  value={itemForm.title} 
                                  onChange={(e) => setItemForm({ ...itemForm, title: e.target.value })} 
                                  placeholder="e.g., Long cardigan"
                                />
                              </div>

                              {/* Purchase Link */}
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">Purchase Link</label>
                                <input 
                                  className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm" 
                                  value={itemForm.href} 
                                  onChange={(e) => setItemForm({ ...itemForm, href: e.target.value })} 
                                  placeholder="https://..."
                                />
                              </div>

                              {/* Image URL */}
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">Image URL</label>
                                <input 
                                  className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm" 
                                  type="url"
                                  value={itemForm.image} 
                                  onChange={(e) => setItemForm({ ...itemForm, image: e.target.value })} 
                                  placeholder="/images/guides/item.webp"
                                />
                              </div>

                              {/* Featured and Actions */}
                              <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2 text-xs text-gray-600">
                                  <input
                                    type="checkbox"
                                    checked={itemForm.is_featured || false}
                                    onChange={(e) => setItemForm({ ...itemForm, is_featured: e.target.checked })}
                                    className="h-4 w-4 text-accent border-gray-300 rounded focus:ring-accent"
                                  />
                                  <span>Featured item</span>
                                </label>
                                
                                <div className="flex gap-2 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
                                  <button 
                                    onClick={addItem}
                                    disabled={!itemForm.title.trim()}
                                    className="rounded bg-green-600 px-3 py-1 text-xs text-white hover:bg-green-700 active:scale-95 disabled:opacity-50 disabled:hover:bg-green-600 disabled:active:scale-100 transition-all duration-200"
                                  >
                                    Update
                                  </button>
                                  <button 
                                    onClick={cancelEditItem}
                                    className="rounded bg-gray-500 px-3 py-1 text-xs text-white hover:bg-gray-600 active:scale-95 transition-all duration-200"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Image Preview */}
                            {itemForm.image && (
                              <div className="mt-3 p-2 bg-gray-50 rounded-md animate-fadeIn" style={{ animationDelay: '0.15s' }}>
                                <p className="text-xs text-gray-600 mb-1">Preview:</p>
                                <div className="flex items-center gap-2">
                                  <img 
                                    src={itemForm.image} 
                                    alt="Item preview" 
                                    className="w-12 h-12 object-cover rounded border"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                    }}
                                  />
                                  <div className="flex-1">
                                    <p className="text-xs text-gray-900 truncate">{itemForm.image}</p>
                                    <button
                                      type="button"
                                      onClick={() => setItemForm({ ...itemForm, image: '' })}
                                      className="text-xs text-red-600 hover:text-red-800"
                                    >
                                      Remove image
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 italic">No items added yet</p>
                  )}
                </div>
                
                <div className="mt-3 p-3 bg-green-50 rounded-md">
                  <p className="text-xs text-green-700">
                    <strong>Tips:</strong><br/>
                    • Drag and drop items to reorder them using the drag handle (⋮⋮)<br/>
                    • Items are numbered in order starting from 1<br/>
                    • Each item should represent a product or piece in the guide<br/>
                    • Include direct purchase links for better user experience
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <button 
                onClick={saveGuide} 
                disabled={saving || !form.title.trim() || !form.slug.trim()} 
                className="rounded-md bg-black px-4 py-2 text-white disabled:opacity-60"
              >
                {saving ? 'Saving...' : (editingGuide ? 'Update Guide' : 'Create Guide')}
              </button>
              <button 
                onClick={() => setOpenModal(false)} 
                className="rounded-md border border-gray-300 px-4 py-2"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
