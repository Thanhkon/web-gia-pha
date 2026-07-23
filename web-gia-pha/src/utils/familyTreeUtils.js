export const buildAdjacencyLists = (relationships, personsMap) => {
  const adj = {};
  personsMap.forEach((_, id) => {
    adj[id] = { spouses: [], children: [], parents: [] };
  });

  relationships.forEach(rel => {
    const { person_a, person_b, type } = rel;
    if (!adj[person_a] || !adj[person_b]) return;

    if (type === 'marriage') {
      adj[person_a].spouses.push(person_b);
      adj[person_b].spouses.push(person_a);
    } else if (type === 'biological_child' || type === 'adopted_child') {
      adj[person_a].children.push(person_b);
      adj[person_b].parents.push(person_a);
    }
  });
  return adj;
};

export const getTreeData = (personId, personsMap, adj, filters = {}) => {
  const person = personsMap.get(personId);
  if (!person) return null;

  const lists = adj[personId] || { spouses: [], children: [] };

  let spouses = [...new Set(lists.spouses)]
    .map(id => personsMap.get(id))
    .filter(Boolean);

  let children = [...new Set(lists.children)]
    .map(id => personsMap.get(id))
    .filter(Boolean)
    .sort((a, b) => {
      const yearA = a.birthYear || (a.dateOfBirth ? new Date(a.dateOfBirth).getFullYear() : 9999);
      const yearB = b.birthYear || (b.dateOfBirth ? new Date(b.dateOfBirth).getFullYear() : 9999);
      return yearA - yearB;
    });

  // Áp dụng bộ lọc
  if (filters.hideDaughtersInLaw) spouses = spouses.filter(s => !(s.gender === 'female' && s.isInLaw));
  if (filters.hideSonsInLaw) spouses = spouses.filter(s => !(s.gender === 'male' && s.isInLaw));
  if (filters.hideDaughters) children = children.filter(c => c.gender !== 'female');
  if (filters.hideSons) children = children.filter(c => c.gender !== 'male');
  if (filters.hideMales) children = children.filter(c => c.gender !== 'male');
  if (filters.hideFemales) children = children.filter(c => c.gender !== 'female');

  const childrenWithParent = children.map(child => {
    const childParents = adj[child.id].parents;
    const matchedSpouse = spouses.find(s => childParents.includes(s.id));
    return matchedSpouse ? { ...child, otherParentId: matchedSpouse.id } : child;
  });

  return { person, spouses, children: childrenWithParent, hasAnyChildren: childrenWithParent.length > 0 };
};
