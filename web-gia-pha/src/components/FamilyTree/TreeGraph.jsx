import React, { useMemo } from 'react';
import { Minus, Plus } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import FamilyNodeCard from './FamilyNodeCard';
import { getTreeData } from '../../utils/familyTreeUtils';
import { setNodeCollapse } from '../../store/slices/membersSlice';

const TreeNode = React.memo(({
  personId,
  level = 0,
  // Dùng Set thay vì Array để: O(1) lookup thay vì O(n), và tránh tạo array mới mỗi render
  ancestorSet = EMPTY_SET,
  personsMap,
  adj,
  filters,
  onAddChild,
  onAddSpouse,
  onViewDetails,
  isKinshipMode,
  kinshipNodeA,
  kinshipNodeB,
  canEdit
}) => {
  // Mọi hook phải được gọi ở top level trước khi early return
  const currentAncestorSet = useMemo(
    // eslint-disable-next-line react-hooks/exhaustive-deps
    () => new Set([...ancestorSet, personId]),
    [personId, ancestorSet]
  );

  const isCollapsedFromRedux = useSelector(state => state.members.ui.collapsedNodes[personId]);
  const isCollapsed = isCollapsedFromRedux !== undefined ? isCollapsedFromRedux : level >= 2;
  const dispatch = useDispatch();

  // Cycle guard với Set: O(1) thay vì O(n) array.includes()
  if (ancestorSet.has(personId)) return null;

  const handleToggleCollapse = (e) => {
    e.stopPropagation();
    e.preventDefault();
    dispatch(setNodeCollapse({ personId, isCollapsed: !isCollapsed }));
  };

  const treeData = getTreeData(personId, personsMap, adj, filters);
  if (!treeData) return null;

  const { person, spouses, children, hasAnyChildren } = treeData;

  const collapseBtn = hasAnyChildren && (
    <button
      className="toggle-collapse-btn"
      onClick={handleToggleCollapse}
    >
      {isCollapsed ? <Plus size={12} /> : <Minus size={12} />}
    </button>
  );

  const childList = hasAnyChildren && !isCollapsed && (
    <ul>
      {children.map(child => (
        <TreeNode
          key={child.id}
          personId={child.id}
          level={level + 1}
          ancestorSet={currentAncestorSet}
          personsMap={personsMap}
          adj={adj}
          filters={filters}
          onAddChild={onAddChild}
          onAddSpouse={onAddSpouse}
          onViewDetails={onViewDetails}
          isKinshipMode={isKinshipMode}
          kinshipNodeA={kinshipNodeA}
          kinshipNodeB={kinshipNodeB}
          canEdit={canEdit}
        />
      ))}
    </ul>
  );

  // Người Độc thân
  if (spouses.length === 0) {
    return (
      <li>
        <div className="single-spouse-wrapper">
          <FamilyNodeCard
            person={person}
            onAddChild={onAddChild}
            onAddSpouse={onAddSpouse}
            id={`node-${person.id}`}
            onViewDetails={onViewDetails}
            isKinshipMode={isKinshipMode}
            kinshipNodeA={kinshipNodeA}
            kinshipNodeB={kinshipNodeB}
            canEdit={canEdit}
          />
          {collapseBtn}
        </div>
        {childList}
      </li>
    );
  }

  // Có vợ/chồng (Gộp khung chung)
  return (
    <li>
      <div className="single-spouse-wrapper">
        <div className="couple-node">
          <div className="couple-frame">
            <FamilyNodeCard
              person={person}
              onAddChild={onAddChild}
              onAddSpouse={onAddSpouse}
              id={`node-${person.id}`}
              onViewDetails={onViewDetails}
              isKinshipMode={isKinshipMode}
              kinshipNodeA={kinshipNodeA}
              kinshipNodeB={kinshipNodeB}
              canEdit={canEdit}
            />

            {spouses.map((spouse) => (
              <React.Fragment key={spouse.id}>
                <div className="couple-divider"></div>
                <FamilyNodeCard
                  person={spouse}
                  onAddChild={onAddChild}
                  onAddSpouse={onAddSpouse}
                  id={`node-${spouse.id}`}
                  onViewDetails={onViewDetails}
                  isKinshipMode={isKinshipMode}
                  kinshipNodeA={kinshipNodeA}
                  kinshipNodeB={kinshipNodeB}
                  canEdit={canEdit}
                />
              </React.Fragment>
            ))}

            {collapseBtn}
          </div>
        </div>

        {hasAnyChildren && !isCollapsed && (
          <ul className={spouses.length > 1 && filters.groupChildrenBySpouse ? 'spouse-groups-list' : ''}>
            {spouses.length > 1 && filters.groupChildrenBySpouse ? (
              <>
                {spouses.map(spouse => {
                  const spouseChildren = children.filter(c => c.otherParentId === spouse.id);
                  if (spouseChildren.length === 0) return null;
                  return (
                    <li key={`group-${spouse.id}`} className="spouse-group-branch">
                      <div className="spouse-group-label">
                        Con của {spouse.fullName}
                      </div>
                      <ul>
                        {spouseChildren.map(child => (
                          <TreeNode
                            key={child.id}
                            personId={child.id}
                            level={level + 1}
                            ancestorSet={currentAncestorSet}
                            personsMap={personsMap}
                            adj={adj}
                            filters={filters}
                            onAddChild={onAddChild}
                            onAddSpouse={onAddSpouse}
                            onViewDetails={onViewDetails}
                            isKinshipMode={isKinshipMode}
                            kinshipNodeA={kinshipNodeA}
                            kinshipNodeB={kinshipNodeB}
                            canEdit={canEdit}
                          />
                        ))}
                      </ul>
                    </li>
                  );
                })}
                {children.filter(c => !c.otherParentId).length > 0 && (
                  <li className="spouse-group-branch">
                    <div className="spouse-group-label">Khác</div>
                    <ul>
                      {children.filter(c => !c.otherParentId).map(child => (
                        <TreeNode
                          key={child.id}
                          personId={child.id}
                          level={level + 1}
                          ancestorSet={currentAncestorSet}
                          personsMap={personsMap}
                          adj={adj}
                          filters={filters}
                          onAddChild={onAddChild}
                          onAddSpouse={onAddSpouse}
                          onViewDetails={onViewDetails}
                          isKinshipMode={isKinshipMode}
                          kinshipNodeA={kinshipNodeA}
                          kinshipNodeB={kinshipNodeB}
                          canEdit={canEdit}
                        />
                      ))}
                    </ul>
                  </li>
                )}
              </>
            ) : (
              children.map(child => (
                <TreeNode
                  key={child.id}
                  personId={child.id}
                  level={level + 1}
                  ancestorSet={currentAncestorSet}
                  personsMap={personsMap}
                  adj={adj}
                  filters={filters}
                  onAddChild={onAddChild}
                  onAddSpouse={onAddSpouse}
                  onViewDetails={onViewDetails}
                  isKinshipMode={isKinshipMode}
                  kinshipNodeA={kinshipNodeA}
                  kinshipNodeB={kinshipNodeB}
                  canEdit={canEdit}
                />
              ))
            )}
          </ul>
        )}
      </div>
    </li>
  );
});

TreeNode.displayName = 'TreeNode';

// Singleton ổn định — không bao giờ tạo object mới
const EMPTY_SET = new Set();

const TreeGraph = React.memo(({
  roots,
  personsMap,
  adj,
  filters,
  onAddChild,
  onAddSpouse,
  onViewDetails,
  isKinshipMode,
  kinshipNodeA,
  kinshipNodeB,
  canEdit
}) => {
  return (
    <div id="exportable-tree-container" className="css-tree">
      <ul>
        {roots.map(root => (
          <TreeNode
            key={root.id}
            personId={root.id}
            personsMap={personsMap}
            adj={adj}
            filters={filters}
            onAddChild={onAddChild}
            onAddSpouse={onAddSpouse}
            onViewDetails={onViewDetails}
            isKinshipMode={isKinshipMode}
            kinshipNodeA={kinshipNodeA}
            kinshipNodeB={kinshipNodeB}
            canEdit={canEdit}
            ancestorSet={EMPTY_SET}
          />
        ))}
      </ul>
    </div>
  );
});

TreeGraph.displayName = 'TreeGraph';

export default TreeGraph;
