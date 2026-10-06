-- ZyroBet Seed Data (Games Catalog)
INSERT INTO public.games (id, slug, title, category, thumb_url, is_new, is_hot, sort_order, enabled)
VALUES
    ('neon-2048', 'neon-2048', 'Neon 2048', 'puzzle', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80', false, true, 1, true),
    ('memory-matrix', 'memory-matrix', 'Memory Matrix', 'puzzle', 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=400&q=80', true, true, 2, true),
    ('tap-reflex', 'tap-reflex', 'Tap Reflex', 'arcade', 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=400&q=80', false, true, 3, true),
    ('word-sprint', 'word-sprint', 'Word Sprint', 'puzzle', 'https://images.unsplash.com/photo-1546776310-eef45dd6d63c?auto=format&fit=crop&w=400&q=80', true, false, 4, true),
    ('quiz-rush', 'quiz-rush', 'Quiz Rush', 'quiz', 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?auto=format&fit=crop&w=400&q=80', false, true, 5, true),
    ('cyber-runner', 'cyber-runner', 'Cyber Runner', 'arcade', 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80', true, false, 6, true),
    ('color-flow', 'color-flow', 'Color Flow', 'puzzle', 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=400&q=80', false, false, 7, true),
    ('sound-match', 'sound-match', 'Echo Beat', 'arcade', 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80', false, false, 8, true),
    ('target-sniper', 'target-sniper', 'Precision Tap', 'arcade', 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=400&q=80', false, false, 9, true)
ON CONFLICT (id) DO NOTHING;
