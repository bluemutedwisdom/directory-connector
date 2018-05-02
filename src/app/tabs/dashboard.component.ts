import { Component } from '@angular/core';

import { I18nService } from 'jslib/abstractions/i18n.service';

import { AzureDirectoryService } from '../../services/azure-directory.service';
import { GSuiteDirectoryService } from '../../services/gsuite-directory.service';
import { LdapDirectoryService } from '../../services/ldap-directory.service';
import { SyncService } from '../../services/sync.service';

import { GroupEntry } from '../../models/groupEntry';
import { UserEntry } from '../../models/userEntry';

@Component({
    selector: 'app-dashboard',
    templateUrl: 'dashboard.component.html',
})
export class DashboardComponent {
    simGroups: GroupEntry[];
    simUsers: UserEntry[];
    simPromise: Promise<any>;
    syncPromise: Promise<any>;
    sinceLast: boolean = false;

    constructor(private i18nService: I18nService, private syncService: SyncService) { }

    async sync() {
        this.syncPromise = this.syncService.sync(false, true);
        await this.syncPromise;
    }

    async simulate() {
        this.simPromise = new Promise(async (resolve, reject) => {
            try {
                const result = await this.syncService.sync(!this.sinceLast, false);
                this.simUsers = result[1];
                this.simGroups = result[0];
            } catch (e) {
                reject(e || 'Sync error.');
            }

            const userMap = new Map<string, UserEntry>();
            if (this.simUsers != null) {
                this.simUsers.forEach((u) => {
                    userMap.set(u.externalId, u);
                });
            }

            if (userMap.size > 0 && this.simGroups != null) {
                this.simGroups.forEach((g) => {
                    if (g.userMemberExternalIds == null) {
                        return;
                    }

                    g.userMemberExternalIds.forEach((uid) => {
                        if (userMap.has(uid)) {
                            if ((g as any).users == null) {
                                (g as any).users = [];
                            }
                            (g as any).users.push(userMap.get(uid));
                        }
                    });
                });
            }
            resolve();
        });
    }
}
