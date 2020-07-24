<template>
  <div id="videoUrlSelectionPanel">

    <Tree id="fileTree" ref="fileTree" :nodes="fileTreeData" :custom-options="fileTreeOptions" :custom-styles="fileTreeStyles"></Tree>

      <!-- Enter URL of your MPD file
      <br/>
      <b-form-input v-model="selectedVideoUrl" lazy type="url" class="bigInputText" />
      <p/> -->

      <div v-if="readyToWatchInd" >
        <b-button @click.prevent="watchVideo" size="lg" variant="success">WATCH</b-button>
        <b-button @click="goBackToLogin" size="lg" variant="warning" style="margin-left: 20px">LOGIN AGAIN</b-button>
      </div>

      <b-spinner v-else type="grow" variant="success" style="width: 0.8em; height: 0.8em;" />

      <b-modal ref="readyToWatchModal" hide-footer title="Ready to watch?">
        <div class="d-block text-center">
          <h3> {{selectedVideoUrl}} </h3>
        </div>

        <b-button @click.prevent="watchVideo" size="lg" variant="success">WATCH</b-button>
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
      readyToWatchInd: true,
      fileTreeData: []
    }
  },

  mounted () {
    this.fetchDirectoryListing(null, dirListingOrVideoUrl => {
      if (Array.isArray(dirListingOrVideoUrl)) {
        this.fileTreeData = this.convertToTreeNodes(dirListingOrVideoUrl)
      }
      else {
        this.$store.commit('updateErrors', 'There should be no videos in the root folder!')
      }
    })
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
      if (node.state.expanded) {
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
            // alert(`PLAYING ${dirListingOrVideoUrl}`)

            this.$refs.readyToWatchModal.show()
          }
          node.text = this.fileDisplayName(node.id)
        })
      }
    }
  },

  computed: {
    ...mapFields(['selectedVideoUrl']),

    fileTreeStyles () {
      return {
        tree: {
          height: 'auto',
          // maxHeight: '300px',
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
          cursor: 'pointer'
        }

        // row: {
        //   width: '500px',
        //   cursor: 'pointer',
        //   child: {
        //     height: '35px'
        //   }
        // },
        // addNode: {
        //   class: 'custom_class',
        //   style: {
        //     color: '#007AD5'
        //   }
        // },
        // editNode: {
        //   class: 'custom_class',
        //   style: {
        //     color: '#007AD5'
        //   }
        // },
        // deleteNode: {
        //   class: 'custom_class',
        //   style: {
        //     color: '#EE5F5B'
        //   }
        // },
        // selectIcon: {
        //   class: 'custom_class',
        //   style: {
        //     color: '#007AD5'
        //   },
        //   active: {
        //     class: 'custom_class',
        //     style: {
        //       color: '#2ECC71'
        //     }
        //   }
        // },
        // text: {
        //   style: {},
        //   active: {
        //     style: {
        //       'font-weight': 'bold',folder
        //       color: '#2ECC71'
        //     }
        //   }
        // }
      }
    },

    fileTreeOptions () {
      return {
        treeEvents: {
          // expanded: {
          //   state: true,
          //   fn: this.fileSelected
          // },
          // collapsed: {
          //   state: false,
          //   fn: null
          // },
          selected: {
            state: true,
            fn: this.fileSelected
          }
          // checked: {
          //   state: true,
          //   fn: this.fileSelected
          // }
        },

        events: {
          // expanded: {
          //   state: true,
          //   fn: this.fileSelected
          // },
          selected: {
            state: true,
            fn: this.fileSelected
          },
          //   checked: {
          //     state: false,
          //     fn: null
          //   },
          editableName: {
            state: true,
            fn: this.fileSelected,
            calledEvent: 'selected'
          }
        }

        // addNode: { state: false, fn: null, appearOnHover: false },

        // editNode: { state: true, fn: null, appearOnHover: true },

        // deleteNode: { state: true, fn: null, appearOnHover: true },

        // showTags: true
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
</style>
