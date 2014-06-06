__author__ = "rekenerd"

from model.user import User
from model.userrole import UserRole
from model.community import Community

class UserRoleHandler():
    memberRole = "member"
    
    @classmethod
    def insert(cls, user, community, role=None):
        entity = None
        
        if role is None:
            role = cls.memberRole
            
        if type(community) is not Community:
            community = Community.get_by_id(community.id) if community.id else None
        
        if user.id:
            user = User.get_by_id(user.id)
        elif user.user_email:
            user = User.find_user_by_email(user.user_email)

        if user and community:
            entity = UserRole.insert(user=user, community=community, role=role)
            
        return entity
