@@ .. @@
                       <div className="flex items-center gap-1">
                         <Star size={14} />
                         <span>{profile.stats.total_favorites} favorites</span>
                       </div>
                     </div>
                     <Button
                       variant="outline"
                       size="sm"
                       onClick={() => navigate(`/profile/${profile.id}`)}
                       leftIcon={<User size={14} />}
                     >
                       View Profile
                     </Button>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-semibold text-gray-900 truncate">
                      {profile.display_name || 'Anonymous User'}
                    </h2>
                    {profile.bio && (
                      <p className="mt-1 text-sm text-gray-600 line-clamp-2">{profile.bio}</p>