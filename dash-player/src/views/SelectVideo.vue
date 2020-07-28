<template>
  <div id="videoUrlSelectionPanel">

    <!-- Header Text -->
    <div class="bigScreenText text-center">Select what you want to watch</div>
    <div class="smallerScreenText text-center otherColor">
      (Or <span class="btn-link" style="cursor: pointer" @click="openUrlInputDialog">copy-and-paste</span> a link)
    </div>
    <hr class="fatOne"/>

    <!-- Video browser tree -->
    <Tree id="fileTree" ref="fileTree" :nodes="fileTreeData" :custom-options="fileTreeOptions" :custom-styles="fileTreeStyles"></Tree>

    <!-- Video selected confirmation dialog -->
    <b-modal ref="readyToWatchModal" title="Ready to watch?"
        size="xl"
        title-class="mediumScreenText"
        header-bg-variant="warning"
        header-text-variant="dark"
        header-class="darkBottomBorder"
        footer-class="darkTopBorder"
        bodyBgVariant="dark"
        footer-bg-variant="dark">
      <b-container fluid>
        <b-row>
          <b-col class="smallerScreenText">
            {{selectedVideoUrl}}
          </b-col>
        </b-row>
      </b-container>
      <template v-slot:modal-footer>
        <b-container fluid>
        <b-row align-v="center" class="text-center" style="height: 90%">
          <b-col>
            <b-button @click.prevent="watchVideo" size="funsize" variant="primary">WATCH</b-button>
          </b-col>
        </b-row>
        </b-container>
      </template>
    </b-modal>

    <!-- Manuall URL entry dialog -->
    <b-modal ref="urlInputModal" title="Enter URL of your MPD file..."
        size="xl"
        title-class="mediumScreenText"
        header-bg-variant="warning"
        header-text-variant="dark"
        header-class="darkBottomBorder"
        footer-class="darkTopBorder"
        bodyBgVariant="dark"
        footer-bg-variant="dark">
      <b-container fluid>
        <b-row>
          <b-col class="smallerScreenText">
            <b-form-input v-model="selectedVideoUrl" autofocus lazy type="url" class="bigInputText" />
          </b-col>
        </b-row>
      </b-container>
      <template v-slot:modal-footer>
        <b-container fluid>
        <b-row align-v="center" class="text-center" style="height: 90%">
          <b-col>
            <b-button @click.prevent="watchVideo" size="funsize" variant="primary">WATCH</b-button>
          </b-col>
        </b-row>
        </b-container>
      </template>
    </b-modal>

  </div>
</template>

<script>
import { mapFields } from 'vuex-map-fields'
import { getServerQuery } from '@/utils/axios-utils'

export default {
  components: {
    Tree: () => import('vuejs-tree')
  },

  data () {
    return {
      readyToWatchInd: true
    }
  },

  mounted () {
    if (this.fileTreeData.length === 0) {
      this.fetchDirectoryListing(null, dirListingOrVideoUrl => {
        if (Array.isArray(dirListingOrVideoUrl)) {
          this.$store.commit('updateFileTreeData', this.convertToTreeNodes(dirListingOrVideoUrl))
        }
        else {
          this.$store.commit('updateErrors', 'There should be no videos in the root folder!')
        }
      })
    }
  },

  methods: {
    fetchDirectoryListing (prefix, dataReceivedCallback) {
      const queryParams = {
        delimiter: '/'
      }

      if (prefix) {
        if (!prefix.endsWith('/')) {
          prefix += '/'
        }
        queryParams.prefix = prefix
      }

      getServerQuery({
        endpoint: 'https://www.googleapis.com/storage/v1/b/dash-video-storage/o',
        parameters: queryParams
      })
        .then(response => {
          const dirListing = response.data.prefixes
          console.log(`Received directory listing with ${dirListing.length} items.`)

          let streamMPD = null
          if (response.data.items && response.data.items.length > 0) {
            streamMPD = response.data.items.find(el => el.name.endsWith('stream.mpd'))
          }

          if (streamMPD) {
            console.log(`Found a leaf video node: ${streamMPD.name}`)
            dataReceivedCallback(streamMPD.name)
          }
          else {
            dataReceivedCallback(dirListing)
          }
        })
        .catch(error => {
          this.$store.commit('updateErrors', error)
        })
    },

    convertToTreeNodes (dirListing) {
      const treeItems = []

      dirListing.forEach(filePath => {
        treeItems.push({
          id: filePath,
          text: this.fileDisplayName(filePath),
          selectable: false,
          expandable: false
        })
      })

      return treeItems
    },

    fileDisplayName (fullObjectName) {
      const pathElements = fullObjectName.split('/').filter(el => el.length > 0)

      if (pathElements.length === 1) {
        return pathElements[0]
      }
      else {
        return pathElements.pop()
      }
    },

    watchVideo () {
      this.$refs.urlInputModal.hide()

      this.readyToWatchInd = false
      if (this._checkVideoUrl()) {
        this.$router.push({ path: '/videoPlayer' })
      } else {
        this.readyToWatchInd = true
      }
    },

    goBackToLogin () {
      this.$router.push({ path: '/' })
    },

    _checkVideoUrl () {
      try {
        // eslint-disable-next-line no-new
        new URL(this.selectedVideoUrl)
        return true
      } catch (error) {
        this.$store.commit('updateErrors', 'The URL you specified is invalid!')
        return false
      }
    },

    fileSelected (node) {
      if (node.state && node.state.expanded) {
        this.$refs.fileTree.collapseNode(node.id)
      }
      else {
        node.text = 'Loading...'
        this.fetchDirectoryListing(node.id, dirListingOrVideoUrl => {
          if (Array.isArray(dirListingOrVideoUrl)) {
            node.nodes = this.convertToTreeNodes(dirListingOrVideoUrl)
            this.$refs.fileTree.expandNode(node.id)
          }
          else {
            // This is a playable leaf file that we can feed to the DASH player
            //
            this.$store.commit(
              'updateSelectedVideoUrl',
              'https://storage.googleapis.com/dash-video-storage/' + dirListingOrVideoUrl
            )

            this.$refs.readyToWatchModal.show()
          }
          node.text = this.fileDisplayName(node.id)
        })
      }
    },

    openUrlInputDialog () {
      this.$refs.urlInputModal.show()
    }
  },

  computed: {
    ...mapFields(['selectedVideoUrl', 'fileTreeData']),

    fileTreeStyles () {
      return {
        tree: {
          height: 'auto',
          overflowY: 'auto',
          display: 'inline-block'
        },
        selectIcon: {
          class: 'hide_folder_icon',
          active: {
            class: 'hide_folder_icon'
          }

        },
        row: {
          width: '100%',
          cursor: 'pointer',
          child: {
            height: '55px'
          }
        },
        text: {
          style: {
            'font-size': '2em'
          }
        }
      }
    },

    fileTreeOptions () {
      return {
        treeEvents: {
          selected: {
            state: true,
            fn: this.fileSelected
          }
        },

        events: {
          selected: {
            state: true,
            fn: this.fileSelected
          },
          editableName: {
            state: true,
            fn: this.fileSelected,
            calledEvent: 'selected'
          }
        }
      }
    }
  }

}
</script>

<style scoped>
  #fileTree {
    text-align: left !important
  }

  .hide_folder_icon {
    display: none;
  }

  .fatOne {
    margin-top: 0px;
    border: 5px solid;
  }

</style>
